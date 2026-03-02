<?php
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DeedPaymentController;
use App\Http\Controllers\DeedReviewController;
use App\Http\Controllers\PhoneVerificationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeedController;
use App\Http\Controllers\DeedWriterController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\UserSearchController;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', fn() => response()->json(['status' => 'ok', 'timestamp' => now()]));

// Public location endpoints
Route::get('/locations/divisions', [LocationController::class, 'divisions']);
Route::get('/locations/divisions/{division}/districts', [LocationController::class, 'districtsByDivision']);
Route::get('/locations/districts', [LocationController::class, 'districts']);
Route::get('/locations/districts/{district}/upazilas', [LocationController::class, 'upazilas']);
Route::get('/locations/upazilas/{upazila}/unions', [LocationController::class, 'unions']);
Route::get('/deed-writers', [DeedWriterController::class, 'index']);
Route::get('/deed-writers/{user}', [DeedWriterController::class, 'show']);
Route::post('/deed-writers/{user}/appointments', [AppointmentController::class, 'store']);

// Public
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Email verification (signed URL from email link)
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');

// Public resend — for users who lost their session before verifying
Route::post('/email/verify/resend-by-email', [AuthController::class, 'resendByEmail'])
    ->middleware('throttle:3,1');

// SSE stream — auth via ?token= query param (EventSource cannot send headers)
Route::get('/notifications/stream', [NotificationController::class, 'stream']);

// Authenticated
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',    [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'uploadAvatar']);

    // Phone OTP verification
    Route::post('/phone/send-otp', [PhoneVerificationController::class, 'send'])->middleware('throttle:5,60');
    Route::post('/phone/verify',   [PhoneVerificationController::class, 'verify']);

    // Email verification resend
    Route::post('/email/verify/resend', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1');

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // User search
    Route::get('/users/search', [UserSearchController::class, 'search']);

    // Deeds
    Route::apiResource('deeds', DeedController::class);
    Route::get('/deeds/{deed}/activities', [DeedController::class, 'activities']);

    // Payments (nested under deed + standalone delete)
    Route::get('/deeds/{deed}/payments',    [DeedPaymentController::class, 'index']);
    Route::post('/deeds/{deed}/payments',   [DeedPaymentController::class, 'store']);
    Route::put('/payments/{payment}',       [DeedPaymentController::class, 'update']);
    Route::delete('/payments/{payment}',    [DeedPaymentController::class, 'destroy']);

    // Comments (nested under deed)
    Route::get('/deeds/{deed}/comments',    [CommentController::class, 'index']);
    Route::post('/deeds/{deed}/comments',   [CommentController::class, 'store']);
    Route::delete('/comments/{comment}',    [CommentController::class, 'destroy']);
    Route::get('/comments/{comment}/attachment', [CommentController::class, 'attachment'])
        ->name('comments.attachment');

    // Reviews (nested under deed + standalone update)
    Route::get('/deeds/{deed}/reviews',  [DeedReviewController::class, 'index']);
    Route::post('/deeds/{deed}/reviews', [DeedReviewController::class, 'store']);
    Route::put('/reviews/{review}',      [DeedReviewController::class, 'update']);

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

    // Appointments
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update']);

    // Referrals
    Route::get('/referrals', [ReferralController::class, 'index']);

    // Admin only
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats',               [AdminController::class, 'stats']);
        Route::get('/users',               [AdminController::class, 'users']);
        Route::put('/users/{user}',        [AdminController::class, 'updateUser']);
        Route::get('/deeds',               [AdminController::class, 'deeds']);
    });
});
