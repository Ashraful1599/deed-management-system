<?php
namespace App\Http\Controllers;

use App\Models\BdDivision;
use App\Models\BdDistrict;
use App\Models\BdUpazila;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    public function divisions(): JsonResponse
    {
        return response()->json(BdDivision::orderBy('name')->get(['id', 'name', 'bn_name']));
    }

    public function districtsByDivision(BdDivision $division): JsonResponse
    {
        return response()->json($division->districts()->orderBy('name')->get(['id', 'division_id', 'name', 'bn_name']));
    }

    public function districts(): JsonResponse
    {
        return response()->json(BdDistrict::orderBy('name')->get(['id', 'division_id', 'name', 'bn_name']));
    }

    public function upazilas(BdDistrict $district): JsonResponse
    {
        return response()->json($district->upazilas()->orderBy('name')->get(['id', 'district_id', 'name', 'bn_name']));
    }

    public function unions(BdUpazila $upazila): JsonResponse
    {
        return response()->json($upazila->unions()->orderBy('name')->get(['id', 'upazila_id', 'name', 'bn_name']));
    }
}
