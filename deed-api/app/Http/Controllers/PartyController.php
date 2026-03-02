<?php
namespace App\Http\Controllers;
use App\Http\Requests\Party\StorePartyRequest;
use App\Http\Requests\Party\UpdatePartyRequest;
use App\Http\Resources\DolilListResource;
use App\Http\Resources\PartyResource;
use App\Models\Party;
use Illuminate\Http\Request;

class PartyController extends Controller {
    public function index(Request $request) {
        $query = Party::query();
        if ($request->filled('search')) {
            $query->search($request->search);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        $parties = $query->orderBy('name')->paginate(20);
        return PartyResource::collection($parties);
    }

    public function store(StorePartyRequest $request) {
        $party = Party::create($request->validated());
        return new PartyResource($party);
    }

    public function show(Party $party) {
        return new PartyResource($party);
    }

    public function update(UpdatePartyRequest $request, Party $party) {
        $party->update($request->validated());
        return new PartyResource($party->fresh());
    }

    public function destroy(Party $party) {
        $party->delete();
        return response()->json(['message' => 'Party deleted']);
    }

    public function dolils(Party $party) {
        $dolils = $party->dolils()
            ->with(['property', 'grantors', 'grantees'])
            ->withCount('documents')
            ->orderBy('recording_date', 'desc')
            ->paginate(20);
        return DolilListResource::collection($dolils);
    }
}
