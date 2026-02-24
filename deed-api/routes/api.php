<?php
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeedController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserSearchController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// SSE stream — auth via ?token= query param (EventSource cannot send headers)
Route::get('/notifications/stream', [NotificationController::class, 'stream']);

// Authenticated
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',    [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // User search
    Route::get('/users/search', [UserSearchController::class, 'search']);

    // Deeds
    Route::apiResource('deeds', DeedController::class);

    // Comments (nested under deed)
    Route::get('/deeds/{deed}/comments',    [CommentController::class, 'index']);
    Route::post('/deeds/{deed}/comments',   [CommentController::class, 'store']);
    Route::delete('/comments/{comment}',    [CommentController::class, 'destroy']);
    Route::get('/comments/{comment}/attachment', [CommentController::class, 'attachment'])
        ->name('comments.attachment');

    // Documents (nested under deed + standalone)
    Route::get('/deeds/{deed}/documents',   [DocumentController::class, 'index']);
    Route::post('/deeds/{deed}/documents',  [DocumentController::class, 'store']);
    Route::delete('/documents/{document}',  [DocumentController::class, 'destroy']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])
        ->name('documents.download');

    // Notifications
    Route::get('/notifications',           [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    // Admin only
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats',               [AdminController::class, 'stats']);
        Route::get('/users',               [AdminController::class, 'users']);
        Route::put('/users/{user}',        [AdminController::class, 'updateUser']);
        Route::get('/deeds',               [AdminController::class, 'deeds']);
    });
});
