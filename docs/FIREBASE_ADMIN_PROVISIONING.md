# Existing official ACTCET administrator

Project: astronomytcet-206c1. Database: (default).

The existing identity is actcet@tcetmumbai.in, UID WaEG76cAKLQGOuwBRjbNiuHPS8k2. Its users document already exists as ACTCET Administration, approved Chairperson, accountType club_admin, with null branch/division/year/academicYear. Do not recreate this identity or overwrite its document. The final integration read-back confirmed every stored field and document updateTime unchanged.

The role and approval in this existing document are the runtime authority. Neither the website nor deployed rules requires a custom claim or a separate activation flag. Email verification still reports false; no verification status, password, custom claim or profile field was changed by this task. Organizational owner authorization is separate from the existing runtime permission; the integration does not invent or record that authorization.

An authorized account owner can sign in through the existing Login page using the name ACTCET Administration and their existing email/password. Enter credentials privately in the browser. Never send them to an agent or put them in scripts. The approved profile allows the original website and Admin Portal. No second admin login system is used.

The deployed rules allow an approved Chairperson/Mentor to approve ordinary registrations, create portal events and edit student attendance. Club administrator profiles are read-only to all frontend clients, including other administrators. Trusted project IAM is required for future owner-authorized account maintenance. Club administrators are excluded from student tables and attendance writes.

Normal registrations create a pending Member profile with requestedRole separate from authority, explicit accountType member and the active session from settings/club. Later administrators choose a verified role in Login Approvals; their Auth UID and server timestamp are stored in approvedBy/approvedAt.

For final live privileged acceptance, the authorized owner must sign in and review the approvals, Add Event and attendance workflows. This task tested those operations with isolated emulator administrators only. Do not elevate a disposable live user to bypass owner sign-in. Current live rules were reviewed, tested and deployed as part of the authorized integration.
