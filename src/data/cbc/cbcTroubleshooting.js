/**
 * CBC Help Desk Troubleshooting Guide
 * Source: Updated CBC Help Desk Troubleshooting Tips (2026)
 * For help desk agents resolving caller issues.
 *
 * NOTE: For all troubleshooting steps, if they do not resolve the issue, assign ticket to Accenture.
 * When passing a ticket to Accenture, include:
 *   1. Email associated with the account
 *   2. Request Number (if issue involves a submitted request)
 *   3. Employee/Employer/Agency account email (if issue involves account linking)
 */

export const cbcTroubleshootingCategories = [
  "Account Creation",
  "Login",
  "Account Linking",
  "Background Check Submission",
  "Wrong Account Type",
  "Fingerprint Clearance Card",
  "Miscellaneous",
];

export const cbcTroubleshooting = [
  // ─── ACCOUNT CREATION ────────────────────────────────────────────────────────
  {
    id: "acct-user-already-exists",
    category: "Account Creation",
    issue: '"User already exists" error after entering email',
    steps: [
      "Ask user to go to the Login page and select Forgot Password.",
      "Have the user enter their email on the following page, then check their inbox for the password reset email. Note: the email will appear to come from DPS, but it is actually from CBC. If the user does not receive the email, the password will need to be reset from the backend.",
      "Have the user click the link from the email. They will be brought to the DPS PSP to answer security questions. If the user does not know the answers, the password will need to be reset from the backend.",
      "After answering the security questions correctly, the user will be able to type in a new password.",
      "After entering the new password, ensure the user returns to the CBC to login.",
    ],
  },
  {
    id: "acct-state-dropdown",
    category: "Account Creation",
    issue: '"State" dropdown not populating when entering address',
    steps: [
      "Ask user to try clearing their cache or using a different browser (e.g., Chrome instead of Edge).",
      "If that does not work, ask user to try using a different Wi-Fi network, cellular data, or hotspot — this may be an issue with their network's firewall.",
    ],
  },
  {
    id: "acct-security-questions-dropdown",
    category: "Account Creation",
    issue: '"Security Questions" dropdowns not populating',
    steps: [
      "Ask user to try clearing their cache or using a different browser (e.g., Chrome instead of Edge).",
      "If that does not work, ask user to try using a different Wi-Fi network, cellular data, or hotspot — this may be an issue with their network's firewall.",
    ],
  },
  {
    id: "acct-error-creating-user",
    category: "Account Creation",
    issue:
      '"Error while creating user" or "Something went wrong" error message',
    steps: [
      'After clicking the Create Account button on the last page of the sign-up form, if the user receives an "Error while creating user" or "Something went wrong, please try again later" error, assign to Accenture. Include screenshots with the timestamp of the error, the user\'s email, and the type of account they are attempting to create.',
    ],
  },
  {
    id: "acct-cannot-verify",
    category: "Account Creation",
    issue: "User cannot verify their account",
    steps: [
      'If the user successfully created their account but did not receive the verification email, ask them to check their spam/junk folder for emails from "do_not_reply_psp@azdps.gov".',
      'If the email was not received, ask the user to attempt logging in. After entering their username/password, they should see a pop-up indicating the account needs to be verified. Direct them to click "Resend Verification", then check inbox and spam again.',
      "If the verification email is still not received, follow the steps to verify the account on behalf of the user (found in the Password Reset-Account Verification Guide).",
      "After verifying on their behalf, confirm the user can successfully login.",
      "If the user still cannot login (due to OTP not being sent), assign ticket to Accenture to check if the user's email is on the suppression list. If the user does not have a mobile number on the account, include the mobile number they would like to use for OTP texts.",
    ],
  },

  // ─── LOGIN ────────────────────────────────────────────────────────────────────
  {
    id: "login-forgot-password",
    category: "Login",
    issue: "User does not know their password",
    steps: [
      "Ask user if they have attempted to reset the password themselves using the Forgot Password feature.",
      "If the user has tried but cannot receive the reset email, or does not know the answers to their security questions, the password will need to be reset from the backend (see Password Reset-Account Verification Guide).",
      "If they have not attempted a reset yet, share the following steps: (a) Go to the Login page and select Forgot Password. (b) Enter email and check inbox for the reset email — it will appear to come from DPS but is actually from CBC. If not received, reset from backend. (c) Click the link from the email and answer security questions on the DPS PSP. If the user does not know the answers, reset from backend. (d) After answering correctly, the user can set a new password. (e) After entering the new password, ensure the user returns to CBC to login.",
    ],
  },
  {
    id: "login-psp-not-cbc",
    category: "Login",
    issue: "User can login to DPS PSP but not CBC with same credentials",
    steps: [
      "Ask user to demonstrate ability to login to PSP.",
      'Ask user to demonstrate the error logging into CBC and capture a screenshot. If the user receives the message "This Account is not valid with CBC", they have a DPS account type not permitted to login to CBC. The user can create a new account with a different email, or the existing account must be deleted and recreated on CBC with the correct account type. If the user requests deletion, assign to Accenture.',
      "Ask user to try clearing their cache or using a different browser (e.g., Chrome instead of Edge).",
      "If that does not work, ask user to try a different Wi-Fi network, cellular data, or hotspot — this may be a network firewall issue.",
    ],
  },
  {
    id: "login-no-email-access-otp",
    category: "Login",
    issue:
      "User no longer has access to the email on the account and cannot receive OTP",
    steps: [
      "Ask the user if they would like us to update the email on the account.",
      "If the user wants the email updated, note the new email and assign to Accenture. If possible, ask the user to confirm their expected account type (individual, employer, or agency) so the team can verify the account is set up correctly before making adjustments.",
      "If the user is not concerned about accessing the existing account (no relevant applications or data), they can create a new account with a new email address.",
    ],
  },
  {
    id: "login-otp-not-sent",
    category: "Login",
    issue: "OTP is not being sent to email or mobile device",
    steps: [
      "Ask user to check the spam folder of their email.",
      "Ask user to try logging into the PSP to see if the OTP is received from that end.",
      "If user only has email on the account and would like to add mobile to receive OTP, take down the mobile number.",
      "Assign ticket to Accenture and share details/outcomes gathered.",
    ],
  },
  {
    id: "login-verification-email-not-sent",
    category: "Login",
    issue: "Account verification email is not sent to the user",
    steps: [
      'If the user successfully created the account but has not been able to verify it, refer to the "Account Creation" section, issue: "User cannot verify their account".',
    ],
  },
  {
    id: "login-other",
    category: "Login",
    issue: "Other login issue",
    steps: [
      "Gather information about the login issue.",
      "Assign ticket to Accenture.",
    ],
  },

  // ─── ACCOUNT LINKING ──────────────────────────────────────────────────────────
  {
    id: "link-employee-employer",
    category: "Account Linking",
    issue: "Employee trying to link their Employer",
    steps: [
      "Ask the Employee to login to their account.",
      'On the "Requests" page, check that the user sees 3 blue tiles: "Employment", "Individual/Personal", "Caregiver". If user does not see those tiles, they have the wrong account type — assign to Accenture to delete so they can recreate it properly.',
      'If user has those 3 tiles, ask them to navigate to Dashboard and scroll down to the "My Employee Requests" tile.',
      "If user does not see that tile, they have not submitted an employment request. Direct them to submit an Employment request to link their account to their employer.",
      "If user does see the tile, ask them to click the link to view connected employers.",
      "Have the user check if their Employer's email is already displayed. If it is, accounts are already linked — no action needed.",
      "If the employer's email is not displayed, user can click \"Add Employer\" and enter the Employer's email address.",
      "If accounts link successfully, no action needed.",
      "If the user sees an error that the account does not exist, direct them to reach out to their employer to confirm the correct email associated with the employer account.",
      "If the user sees an error that the account is not set up as an Employer account, assign ticket to Accenture with emails for both employee and employer.",
    ],
  },
  {
    id: "link-employer-employee",
    category: "Account Linking",
    issue: "Employer trying to link their Employee",
    steps: [
      "Ask the Employer to login to their account.",
      'On the "Requests" page, check that the user sees 2 blue tiles: "View connected employee accounts" and "View connected agency accounts". If not, they have the wrong account type — assign to Accenture with the Employer email, DES Affiliation, and DES Division (if applicable).',
      'If user has those 2 tiles, ask them to click "View connected employee accounts".',
      "Have the user check if the Employee's email is already displayed. If it is, accounts are already linked — no action needed. Note: if the employer asks why they cannot see the employee's background check request on the dashboard, explain that the employee has not submitted an Employment background check yet; the record will only appear after the employee submits.",
      "If the employee's email is not displayed, user can click \"Add Employee\" and enter the Employee's email address.",
      "If accounts link successfully, no action needed.",
      "If the user sees an error that the account does not exist, direct them to reach out to the employee to confirm the correct email.",
      "If the user sees an error that the account is not set up as an Employee account, assign ticket to Accenture with both emails.",
    ],
  },
  {
    id: "link-employer-agency",
    category: "Account Linking",
    issue: "Employer trying to link their Agency",
    steps: [
      "Ask the Employer to login to their account.",
      'On the "Requests" page, check that the user sees 2 blue tiles: "View connected employee accounts" and "View connected agency accounts". If not, assign ticket to Accenture with Employer email, DES Affiliation, and DES Division (if applicable).',
      'If user has those 2 tiles, ask them to click "View connected agency accounts".',
      "Have the user check if the Agency's email is already displayed. If it is, accounts are already linked — no action needed.",
      "If the Agency's email is not displayed, user can click \"Add Agency\" and enter the Agency's email address.",
      "If accounts link successfully, no action needed.",
      "If the user sees an error that the account does not exist, direct them to reach out to the Agency to confirm the correct email.",
      "If the user sees an error that the account is not set up as an Agency account, assign ticket to Accenture with employer and agency emails.",
    ],
  },
  {
    id: "link-agency-employer",
    category: "Account Linking",
    issue: "Agency trying to link their Employer",
    steps: [
      'Agency accounts do not currently have the ability to link to Employer accounts. The Agency will need to reach out to the Employer via email and ask them to login and link the accounts. Refer to "Employer trying to link their Agency" if the agency requests steps for how the employer can do this.',
    ],
  },
  {
    id: "link-employee-agency",
    category: "Account Linking",
    issue: "Employee-Agency linking",
    steps: [
      "Employees and Agencies are not permitted to link their accounts directly to each other.",
      "Inform the caller that Employee accounts can only be connected to Employer accounts, and Agency accounts can only be linked to Employer accounts.",
      "In order for an Agency to view background check results for an Employee, both must be linked to a common Employer account: (a) The Employee submits a request with their Employer's email. (b) The Employer then logs in and links their account to the Agency account. (c) Once both the employee-employer and employer-agency links are established, the agency can view the employee's background check results.",
    ],
  },

  // ─── BACKGROUND CHECK SUBMISSION ─────────────────────────────────────────────
  {
    id: "bgcheck-employer-not-registered",
    category: "Background Check Submission",
    issue: "Employer email says it is not registered with the CBC",
    steps: [
      "Ask user to demonstrate the error when entering the employer email and capture a screenshot.",
      "If the user sees an error that the account does not exist, direct them to reach out to their employer to confirm they are using the correct email for the employer account.",
      "If the user has already verified the correct email but still receives the error, assign ticket to Accenture with both employee and employer emails.",
    ],
  },
  {
    id: "bgcheck-dob-incorrect",
    category: "Background Check Submission",
    issue: "Date of Birth is incorrect on background check form",
    steps: [
      "Ask user to confirm the correct DOB.",
      "Ask user to navigate to the background check request form and scroll down to the DOB field.",
      "If DOB is showing as 1 day prior to the expected date, assign ticket to Accenture — this is a known defect on the backlog.",
      'If the user simply entered the DOB incorrectly when creating their account, guide them to the DPS PSP to update it: go to Account Profile in PSP → click "Submit a Name Change Request" → select DOB update. After submitting, DPS will review before approving. Once approved, the user can return to CBC to submit their background check. Note: if the user has a clearance card, they may be charged a card replacement fee.',
    ],
  },
  {
    id: "bgcheck-signature-validation",
    category: "Background Check Submission",
    issue: "Signature Validation error",
    steps: [
      "Ask user to navigate to their Account Profile and take a screenshot showing First Name, Middle Initial, Last Name, and Suffix. Note: if the user needs to change the name on their profile, refer to the Name Change section.",
      "Ask user to navigate to the background check form and attempt to sign with one of these combinations based on what fields they filled out on their profile: (a) First Name + Last Name, (b) First Name + Middle Initial + Last Name, (c) First Name + Middle Initial + Last Name + Suffix, (d) First Name + Last Name + Suffix.",
      "If still receiving errors, double check that there are no extra spaces between names or at the end of the full name.",
      "If errors persist, assign to Accenture with the account email and user's expected name.",
    ],
  },
  {
    id: "bgcheck-fingerprinting-code",
    category: "Background Check Submission",
    issue: "User is asked to provide a fingerprinting code",
    steps: [
      "This occurs when the user is on the DPS PSP, not the CBC. Inform the user they are on the PSP and guide them back to the CBC.",
      "If the user ended up on the PSP because they are trying to link their clearance card and need help, refer to the Fingerprint Clearance Card section.",
    ],
  },
  {
    id: "bgcheck-other",
    category: "Background Check Submission",
    issue: "Other background check submission issues",
    steps: [
      "Returned/rejected request: Guide the user to their Message Center to view the notification — it should contain a note from the OLR team explaining why it was returned. The most common reason is users submitting an Individual/Personal or Caregiver request type when an Employment request type is needed.",
      '"Something went wrong" error on request tiles: Ask user to try again in a different browser or on a different Wi-Fi network (or cellular/hotspot) — most commonly caused by a network firewall. If the error persists, assign to Accenture.',
      "Not seeing 3 background check options on the Requests page: The user has the wrong account type. Assign to Accenture to delete the account so the user can recreate it properly.",
      "User does not know their Contract Number: Direct them to reach out to their Employer. If the Employer is calling, direct them to reach out to their DES Division.",
      'User prompted for Contract Number but not affiliated with DES: Direct them to Account Profile to update their DES Affiliation to "Not Affiliated with DES". If already done and still prompted, assign to Accenture.',
      "Employer asking to submit on behalf of an employee: Inform them that they are not permitted to submit on behalf of employees, but they can assist employees with the process.",
      "Employer needing to submit a background check for themselves: They will need to create a second account as an Individual (one employer account, one individual account) — each requires a unique email address.",
    ],
  },

  // ─── WRONG ACCOUNT TYPE ───────────────────────────────────────────────────────
  {
    id: "wrong-type-identify",
    category: "Wrong Account Type",
    issue: "How to identify a user's account type",
    steps: [
      'Ask the user to login and go to the "Requests" page. The number of blue tiles indicates account type: 3 tiles = Individual, 2 tiles = Employer, 1 tile = Agency.',
    ],
  },
  {
    id: "wrong-type-individual-needs-employer-agency",
    category: "Wrong Account Type",
    issue:
      "User created an Individual account but needs an Employer or Agency account",
    steps: [
      "The account will need to be deleted and recreated by the user. Assign ticket to Accenture to delete the account.",
    ],
  },
  {
    id: "wrong-type-employer-agency-needs-individual",
    category: "Wrong Account Type",
    issue:
      "User created an Employer or Agency account but needs an Individual account",
    steps: [
      "The account will need to be deleted and recreated by the user. Assign ticket to Accenture to delete the account.",
    ],
  },
  {
    id: "wrong-type-employer-needs-agency",
    category: "Wrong Account Type",
    issue: "User created an Employer account but needs an Agency account",
    steps: [
      "First, verify with the user that an Agency account is actually needed — users often confuse this verbiage.",
      "If the user will be reviewing background check results for their own employees, volunteers, caregivers, etc., they need an Employer account — no action needed.",
      "If the user will be monitoring other employer accounts for compliance, they need an Agency account. Assign ticket to Accenture to make the change from the backend.",
    ],
  },
  {
    id: "wrong-type-agency-needs-employer",
    category: "Wrong Account Type",
    issue: "User created an Agency account but needs an Employer account",
    steps: [
      "First, verify with the user that an Employer account is actually needed — users often confuse this verbiage.",
      "If the user will be reviewing background check results for their own employees, volunteers, caregivers, etc., they need an Employer account. Assign ticket to Accenture to make the change from the backend.",
      "If the user will be monitoring other employer accounts for compliance, they need an Agency account — no action needed.",
    ],
  },
  {
    id: "wrong-type-two-accounts",
    category: "Wrong Account Type",
    issue: "User needs both an Employer and an Individual account",
    steps: [
      "If a user needs to review background checks for their employees AND submit a background check for themselves, they must create two separate accounts: one Employer and one Individual. These accounts require unique email addresses — the same email cannot be used for both.",
    ],
  },

  // ─── FINGERPRINT CLEARANCE CARD ───────────────────────────────────────────────
  {
    id: "fcc-link-existing",
    category: "Fingerprint Clearance Card",
    issue: "User needs assistance linking their existing card to their account",
    steps: [
      "Share the following steps with the user. If they get stuck on any step, refer to the other FCC issues in this section.",
      "Step 1: Login to your account on the DPS PSP.",
      "Step 2: Click Services in the header.",
      "Step 3: Click the Fingerprint Clearance Card tile.",
      "Step 4: For 'What action do you need to take?', select 'Apply for a card / Request a replacement' and click Continue.",
      "Step 5: For 'Have you applied for a DPS Fingerprint Clearance Card in the past?', click Yes.",
      "Step 6: Enter your FCC Application Number or Card Number and click Continue.",
      'Step 7: If the FCC information is found, the user will see: "Great! We were able to locate you in our system."',
    ],
  },
  {
    id: "fcc-not-prompted-link",
    category: "Fingerprint Clearance Card",
    issue: "User is not prompted to link their card (Step 5 above fails)",
    steps: ["Assign ticket to Accenture to change a value on the backend."],
  },
  {
    id: "fcc-card-not-found",
    category: "Fingerprint Clearance Card",
    issue: '"Card was not found" message (Step 7 above fails)',
    steps: [
      "The user will need to reach out to DPS for assistance linking the card to their account. We do not have visibility into the DPS Clearance Card system.",
    ],
  },
  {
    id: "fcc-visible-to-user-not-employer",
    category: "Fingerprint Clearance Card",
    issue: "User can see their clearance card on dashboard but employer cannot",
    steps: [
      "The user needs to ensure their account is linked to their Employer's account. Refer to the Account Linking section.",
    ],
  },
  {
    id: "fcc-redirected-to-psp",
    category: "Fingerprint Clearance Card",
    issue:
      "User is continually redirected to DPS PSP to link their card, even when already linked",
    steps: [
      "Confirm with the user that the card is actually linked to their account and shown on their Dashboard. It is common for users to confuse having their FCC linked to their account with linking their Individual account to their Employer's account.",
      "If the card is shown, check what status it displays. Users can only proceed if their card is in a Valid status. Invalid and Expired cards are not accepted by the system.",
      "Valid statuses: Waiting On Applicant Fingerprints, In Process, Pending State or FBI Reprint, Under Supervisor Review, Approved, Issued, Reactivate.",
      "Invalid statuses: Deceased, Denied, Revoked, Suspended, Closed. Expired cards are Not Valid regardless of status.",
      "If the card is valid and still not accepted, assign to Accenture.",
      "If the card is invalid, the user will need to apply for a new card or reach out to DPS to inquire about the status.",
    ],
  },

  // ─── MISCELLANEOUS ────────────────────────────────────────────────────────────
  {
    id: "misc-request-status",
    category: "Miscellaneous",
    issue: "Request Status Issues",
    steps: [
      "If the user recently submitted a new request and is waiting for results, assign to OLR or inform the user that some requests require a manual review that may take several days.",
      "If a request has expired and the user is unsure why, direct them to check their message center. Requests may expire for the following reasons: (a) Name change on account requiring a new request, (b) User submitted a new request causing the old one to expire, (c) Request was submitted over a year ago and annual re-check is required, (d) Employer was prompted to Confirm Relationship with an Employee but failed to respond within 5 days — the employer relationship is removed and the request expires; the user must submit a new background check to restore the relationship, (e) Employee is no longer connected to any Employer accounts — the user should submit a new background check request for their current employer.",
      "If an employer was prompted to confirm an employee relationship but cannot click the Confirm Relationship button, assign ticket to Accenture with a screenshot of the Employer's dashboard. Note: if the employer has not received a message center notification about confirming the relationship, they do not need to confirm, and no further action is needed.",
    ],
  },
  {
    id: "misc-partial-match-aps",
    category: "Miscellaneous",
    issue: "Partial Match for APS",
    steps: [
      "The APS search looks for a No Match, Full Match, or Partial Match to perpetrators on the APS registry based on the requester's demographics.",
      'If a user is found to be a Partial Match, direct the user to check the "Match Elements" column of the table on the result report to identify which demographic information matched the perpetrator.',
      "The employer is responsible for reviewing and determining if the employee is a match for the perpetrator or not.",
      "If the employer determines the requester is NOT a match, refer them to the instructions on the result report document — there is a link to a form to resolve the finding.",
      "If the employer determines the requester IS a match, refer them to https://des.az.gov/APSRegistry for hiring requirements/restrictions for employees found on the registry.",
    ],
  },
  {
    id: "misc-email-change",
    category: "Miscellaneous",
    issue: "Email Change on account",
    steps: ["Assign to Accenture to change from the backend."],
  },
  {
    id: "misc-name-change",
    category: "Miscellaneous",
    issue: "Name Change on account",
    steps: [
      "If the user does NOT have a clearance card, they can complete a name change from the CBC account profile.",
      "If the user DOES have a clearance card, ask them to check if the name on the clearance card matches their current legal name.",
      "If the card name matches their legal name and they only need to update their account profile, assign to Accenture to change from the backend — this prevents the user from being inadvertently charged a card replacement fee by DPS.",
      'If the card name does not match their legal name, direct the user to login to the DPS PSP → Account Profile → click "Submit a name change request" → fill out and submit the form. Note: the user will likely need to pay a Card Replacement fee. A DPS admin will review before approving. Once approved, the name on the account will be updated and the user can return to CBC to submit their background check.',
    ],
  },
  {
    id: "misc-group-email",
    category: "Miscellaneous",
    issue: "Group Email for Employers",
    steps: [
      "Employers are recommended to use a group email for their account when more than one person will be accessing it. By group email, we mean a shared inbox that all authorized staff can access in order to receive the OTP code used for login.",
      "Employees, on the other hand, should use an email address that only they have access to, so that only they can access their account and background check results.",
    ],
  },
  {
    id: "misc-functional-questions",
    category: "Miscellaneous",
    issue: "Functional Questions",
    steps: [
      "Refer the user to the CBC user guides and tutorial videos at https://des.az.gov/cbc.",
      "Any questions not answered by the user guides, tutorials, or troubleshooting steps in this document can be assigned to Accenture, OLR, or DES.",
    ],
  },
];
