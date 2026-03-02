<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DolilBD API</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
        }

        header {
            background: #1e293b;
            border-bottom: 1px solid #334155;
            padding: 1.25rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: .75rem;
        }

        .brand-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
        }

        .brand-name {
            font-size: 1.25rem;
            font-weight: 700;
            color: #f1f5f9;
            letter-spacing: -.3px;
        }

        .brand-name span { color: #3b82f6; }

        .badge {
            font-size: .7rem;
            font-weight: 600;
            padding: .2rem .55rem;
            border-radius: 999px;
            background: #22c55e22;
            color: #22c55e;
            border: 1px solid #22c55e44;
            letter-spacing: .5px;
        }

        .status {
            display: flex;
            align-items: center;
            gap: .4rem;
            font-size: .8rem;
            color: #94a3b8;
        }

        .status-dot {
            width: 7px; height: 7px;
            border-radius: 50%;
            background: #22c55e;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .4; }
        }

        main { max-width: 960px; margin: 0 auto; padding: 2.5rem 1.5rem; }

        .hero {
            text-align: center;
            margin-bottom: 3rem;
        }

        .hero h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #f1f5f9;
            margin-bottom: .5rem;
        }

        .hero p {
            color: #94a3b8;
            font-size: .95rem;
        }

        .meta-row {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
            margin-top: 1.25rem;
            flex-wrap: wrap;
        }

        .meta-item {
            font-size: .78rem;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: .35rem;
        }

        .meta-item strong { color: #94a3b8; }

        .section-title {
            font-size: .7rem;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #475569;
            margin-bottom: 1rem;
            padding-left: .25rem;
        }

        .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 10px;
            margin-bottom: 1.25rem;
            overflow: hidden;
        }

        .card-header {
            padding: .9rem 1.25rem;
            background: #162032;
            border-bottom: 1px solid #334155;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .card-title {
            font-size: .9rem;
            font-weight: 600;
            color: #e2e8f0;
        }

        .route-list { list-style: none; }

        .route-item {
            display: flex;
            align-items: center;
            gap: .75rem;
            padding: .65rem 1.25rem;
            border-bottom: 1px solid #1e293b;
            font-size: .82rem;
            transition: background .15s;
        }

        .route-item:last-child { border-bottom: none; }
        .route-item:hover { background: #162032; }

        .method {
            font-size: .65rem;
            font-weight: 700;
            padding: .2rem .45rem;
            border-radius: 4px;
            min-width: 46px;
            text-align: center;
            letter-spacing: .3px;
        }

        .GET    { background: #1d4ed822; color: #60a5fa; border: 1px solid #1d4ed844; }
        .POST   { background: #15803d22; color: #4ade80; border: 1px solid #15803d44; }
        .PUT    { background: #92400e22; color: #fbbf24; border: 1px solid #92400e44; }
        .PATCH  { background: #6d28d922; color: #a78bfa; border: 1px solid #6d28d944; }
        .DELETE { background: #9f121222; color: #f87171; border: 1px solid #9f121244; }

        .route-path {
            color: #cbd5e1;
            font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: .8rem;
            flex: 1;
        }

        .route-path .param { color: #f59e0b; }

        .route-desc {
            color: #475569;
            font-size: .78rem;
            text-align: right;
        }

        .lock-icon {
            font-size: .75rem;
            color: #f59e0b;
            margin-left: .25rem;
            opacity: .7;
        }

        .public-tag, .auth-tag, .admin-tag {
            font-size: .62rem;
            padding: .15rem .4rem;
            border-radius: 999px;
            font-weight: 600;
        }

        .public-tag { background: #0f4c3022; color: #6ee7b7; border: 1px solid #0f4c3044; }
        .auth-tag   { background: #1e3a5f22; color: #93c5fd; border: 1px solid #1e3a5f44; }
        .admin-tag  { background: #4c0519; color: #fca5a5; border: 1px solid #7f1d1d; }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }

        @media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }

        footer {
            text-align: center;
            padding: 2rem;
            color: #334155;
            font-size: .78rem;
            border-top: 1px solid #1e293b;
            margin-top: 2rem;
        }

        a { color: inherit; text-decoration: none; }
    </style>
</head>
<body>

<header>
    <div class="brand">
        <div class="brand-icon">📜</div>
        <div class="brand-name"><span>Dolil</span>BD</div>
        <span class="badge">v1.0</span>
    </div>
    <div class="status">
        <span class="status-dot"></span>
        API Online &nbsp;·&nbsp; Laravel {{ Illuminate\Foundation\Application::VERSION }} &nbsp;·&nbsp; PHP {{ PHP_VERSION }}
    </div>
</header>

<main>
    <div class="hero">
        <h1>DolilBD REST API</h1>
        <p>Backend API for the DolilBD dolil management platform</p>
        <div class="meta-row">
            <div class="meta-item">🌐 <strong>Base URL</strong> http://localhost:8000/api</div>
            <div class="meta-item">🖥 <strong>Frontend</strong> http://localhost:3000</div>
            <div class="meta-item">🗄 <strong>Database</strong> dolil_db (MySQL)</div>
            <div class="meta-item">🔐 <strong>Auth</strong> Laravel Sanctum</div>
        </div>
    </div>

    {{-- Authentication --}}
    <p class="section-title">Authentication</p>
    <div class="card">
        <ul class="route-list">
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/register</span>
                <span class="route-desc">Register new user</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/login</span>
                <span class="route-desc">Login &amp; get token</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/logout</span>
                <span class="route-desc">Revoke token</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/user</span>
                <span class="route-desc">Current user profile</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method PUT">PUT</span>
                <span class="route-path">/api/profile</span>
                <span class="route-desc">Update profile</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/profile/avatar</span>
                <span class="route-desc">Upload avatar</span>
                <span class="auth-tag">auth</span>
            </li>
        </ul>
    </div>

    {{-- Verification --}}
    <p class="section-title">Verification</p>
    <div class="card">
        <ul class="route-list">
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/email/verify/<span class="param">{id}/{hash}</span></span>
                <span class="route-desc">Verify email link</span>
                <span class="public-tag">signed</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/email/verify/resend-by-email</span>
                <span class="route-desc">Resend without session</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/email/verify/resend</span>
                <span class="route-desc">Resend verification email</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/phone/send-otp</span>
                <span class="route-desc">Send phone OTP (4-digit)</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/phone/verify</span>
                <span class="route-desc">Verify phone OTP</span>
                <span class="auth-tag">auth</span>
            </li>
        </ul>
    </div>

    {{-- Dolil Writers & Appointments (public) --}}
    <p class="section-title">Dolil Writers &amp; Appointments</p>
    <div class="card">
        <ul class="route-list">
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/dolil-writers</span>
                <span class="route-desc">List all dolil writers</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/dolil-writers/<span class="param">{user}</span></span>
                <span class="route-desc">Dolil writer profile</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/dolil-writers/<span class="param">{user}</span>/appointments</span>
                <span class="route-desc">Book appointment</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/appointments</span>
                <span class="route-desc">My appointments</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method PATCH">PATCH</span>
                <span class="route-path">/api/appointments/<span class="param">{appointment}</span></span>
                <span class="route-desc">Update appointment status</span>
                <span class="auth-tag">auth</span>
            </li>
        </ul>
    </div>

    {{-- Dolils --}}
    <p class="section-title">Dolils</p>
    <div class="card">
        <ul class="route-list">
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/dolils</span>
                <span class="route-desc">List dolils</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/dolils</span>
                <span class="route-desc">Create dolil</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/dolils/<span class="param">{dolil}</span></span>
                <span class="route-desc">Show dolil</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method PUT">PUT</span>
                <span class="route-path">/api/dolils/<span class="param">{dolil}</span></span>
                <span class="route-desc">Update dolil</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method DELETE">DELETE</span>
                <span class="route-path">/api/dolils/<span class="param">{dolil}</span></span>
                <span class="route-desc">Delete dolil</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/dolils/<span class="param">{dolil}</span>/activities</span>
                <span class="route-desc">Dolil activity log</span>
                <span class="auth-tag">auth</span>
            </li>
        </ul>
    </div>

    {{-- Payments, Comments, Reviews, Documents --}}
    <div class="grid2">
        <div>
            <p class="section-title">Payments</p>
            <div class="card">
                <ul class="route-list">
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/dolils/<span class="param">{dolil}</span>/payments</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method POST">POST</span>
                        <span class="route-path">/api/dolils/<span class="param">{dolil}</span>/payments</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method PUT">PUT</span>
                        <span class="route-path">/api/payments/<span class="param">{payment}</span></span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method DELETE">DELETE</span>
                        <span class="route-path">/api/payments/<span class="param">{payment}</span></span>
                        <span class="auth-tag">auth</span>
                    </li>
                </ul>
            </div>

            <p class="section-title">Reviews</p>
            <div class="card">
                <ul class="route-list">
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/dolils/<span class="param">{dolil}</span>/reviews</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method POST">POST</span>
                        <span class="route-path">/api/dolils/<span class="param">{dolil}</span>/reviews</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method PUT">PUT</span>
                        <span class="route-path">/api/reviews/<span class="param">{review}</span></span>
                        <span class="auth-tag">auth</span>
                    </li>
                </ul>
            </div>
        </div>

        <div>
            <p class="section-title">Comments</p>
            <div class="card">
                <ul class="route-list">
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/dolils/<span class="param">{dolil}</span>/comments</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method POST">POST</span>
                        <span class="route-path">/api/dolils/<span class="param">{dolil}</span>/comments</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method DELETE">DELETE</span>
                        <span class="route-path">/api/comments/<span class="param">{comment}</span></span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/comments/<span class="param">{comment}</span>/attachment</span>
                        <span class="auth-tag">auth</span>
                    </li>
                </ul>
            </div>

            <p class="section-title">Documents</p>
            <div class="card">
                <ul class="route-list">
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/dolils/<span class="param">{dolil}</span>/documents</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method POST">POST</span>
                        <span class="route-path">/api/dolils/<span class="param">{dolil}</span>/documents</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method DELETE">DELETE</span>
                        <span class="route-path">/api/documents/<span class="param">{document}</span></span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/documents/<span class="param">{document}</span>/download</span>
                        <span class="auth-tag">auth</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    {{-- Notifications --}}
    <p class="section-title">Notifications</p>
    <div class="card">
        <ul class="route-list">
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/notifications/stream</span>
                <span class="route-desc">SSE real-time stream (?token=)</span>
                <span class="public-tag">token</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/notifications</span>
                <span class="route-desc">List notifications</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/notifications/unread-count</span>
                <span class="route-desc">Unread count</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/notifications/mark-all-read</span>
                <span class="route-desc">Mark all as read</span>
                <span class="auth-tag">auth</span>
            </li>
            <li class="route-item">
                <span class="method POST">POST</span>
                <span class="route-path">/api/notifications/<span class="param">{notification}</span>/read</span>
                <span class="route-desc">Mark one as read</span>
                <span class="auth-tag">auth</span>
            </li>
        </ul>
    </div>

    {{-- Locations --}}
    <p class="section-title">Locations (Bangladesh)</p>
    <div class="card">
        <ul class="route-list">
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/locations/divisions</span>
                <span class="route-desc">All divisions</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/locations/divisions/<span class="param">{division}</span>/districts</span>
                <span class="route-desc">Districts by division</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/locations/districts</span>
                <span class="route-desc">All districts</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/locations/districts/<span class="param">{district}</span>/upazilas</span>
                <span class="route-desc">Upazilas by district</span>
                <span class="public-tag">public</span>
            </li>
            <li class="route-item">
                <span class="method GET">GET</span>
                <span class="route-path">/api/locations/upazilas/<span class="param">{upazila}</span>/unions</span>
                <span class="route-desc">Unions by upazila</span>
                <span class="public-tag">public</span>
            </li>
        </ul>
    </div>

    {{-- Other / Admin --}}
    <div class="grid2">
        <div>
            <p class="section-title">Misc</p>
            <div class="card">
                <ul class="route-list">
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/dashboard/stats</span>
                        <span class="route-desc">Dashboard stats</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/users/search</span>
                        <span class="route-desc">Search users</span>
                        <span class="auth-tag">auth</span>
                    </li>
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/referrals</span>
                        <span class="route-desc">My referrals</span>
                        <span class="auth-tag">auth</span>
                    </li>
                </ul>
            </div>
        </div>

        <div>
            <p class="section-title">Admin Only</p>
            <div class="card">
                <ul class="route-list">
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/admin/stats</span>
                        <span class="route-desc">Platform stats</span>
                        <span class="admin-tag">admin</span>
                    </li>
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/admin/users</span>
                        <span class="route-desc">All users</span>
                        <span class="admin-tag">admin</span>
                    </li>
                    <li class="route-item">
                        <span class="method PUT">PUT</span>
                        <span class="route-path">/api/admin/users/<span class="param">{user}</span></span>
                        <span class="route-desc">Update user</span>
                        <span class="admin-tag">admin</span>
                    </li>
                    <li class="route-item">
                        <span class="method GET">GET</span>
                        <span class="route-path">/api/admin/dolils</span>
                        <span class="route-desc">All dolils</span>
                        <span class="admin-tag">admin</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</main>

<footer>
    DolilBD API &nbsp;·&nbsp; Laravel {{ Illuminate\Foundation\Application::VERSION }} &nbsp;·&nbsp; PHP {{ PHP_VERSION }} &nbsp;·&nbsp; MySQL 9.4
</footer>

</body>
</html>
