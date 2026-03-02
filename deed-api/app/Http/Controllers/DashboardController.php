<?php
namespace App\Http\Controllers;
use App\Models\Dolil;
use App\Models\Document;
use App\Models\Comment;
use Illuminate\Http\Request;

class DashboardController extends Controller {
    public function stats(Request $request) {
        $user     = $request->user();
        $dateFrom = $request->filled('date_from') ? $request->date_from : null;
        $dateTo   = $request->filled('date_to')   ? $request->date_to   : null;

        $base = Dolil::query();
        if ($dateFrom) $base->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo)   $base->whereDate('created_at', '<=', $dateTo);

        if ($user->isAdmin()) {
            return response()->json([
                'dolils_total'     => (clone $base)->count(),
                'dolils_by_status' => (clone $base)->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
                'recent_dolils'    => $this->recentDolils(null),
            ]);
        }

        $myDolilIds = (clone $base)
            ->where(fn($q) => $q->where('created_by', $user->id)->orWhere('assigned_to', $user->id))
            ->pluck('id');

        return response()->json([
            'dolils_created'   => (clone $base)->where('created_by', $user->id)->count(),
            'dolils_assigned'  => (clone $base)->where('assigned_to', $user->id)->count(),
            'dolils_by_status' => (clone $base)->whereIn('id', $myDolilIds)
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'recent_dolils'    => $this->recentDolils($user->id),
        ]);
    }

    private function recentDolils(?int $userId) {
        $q = Dolil::with(['creator', 'assignee'])->orderByDesc('created_at')->limit(5);
        if ($userId) $q->where(fn($q2) => $q2->where('created_by', $userId)->orWhere('assigned_to', $userId));
        return $q->get()->map(fn($d) => [
            'id'          => $d->id,
            'title'       => $d->title,
            'status'      => $d->status,
            'created_by'  => $d->creator?->name,
            'assigned_to' => $d->assignee?->name,
            'created_at'  => $d->created_at,
        ]);
    }
}
