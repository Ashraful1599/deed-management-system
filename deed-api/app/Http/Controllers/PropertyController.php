<?php
namespace App\Http\Controllers;
use App\Http\Requests\Property\StorePropertyRequest;
use App\Http\Requests\Property\UpdatePropertyRequest;
use App\Http\Resources\DeedListResource;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use Illuminate\Http\Request;

class PropertyController extends Controller {
    public function index(Request $request) {
        $query = Property::withCount('deeds');
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('address', 'like', "%$term%")
                  ->orWhere('parcel_number', 'like', "%$term%")
                  ->orWhere('city', 'like', "%$term%");
            });
        }
        $properties = $query->orderBy('created_at', 'desc')->paginate(20);
        return PropertyResource::collection($properties);
    }

    public function store(StorePropertyRequest $request) {
        $property = Property::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id]
        ));
        return new PropertyResource($property);
    }

    public function show(Property $property) {
        $property->loadCount('deeds');
        return new PropertyResource($property);
    }

    public function update(UpdatePropertyRequest $request, Property $property) {
        $property->update($request->validated());
        return new PropertyResource($property->fresh());
    }

    public function destroy(Property $property) {
        $property->delete();
        return response()->json(['message' => 'Property deleted']);
    }

    public function chainOfTitle(Property $property) {
        $deeds = $property->deeds()
            ->with(['grantors', 'grantees', 'documents'])
            ->withCount('documents')
            ->orderBy('recording_date', 'asc')
            ->orderBy('effective_date', 'asc')
            ->get();
        return DeedListResource::collection($deeds);
    }
}
