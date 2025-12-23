import { signInWithGoogle } from './firebase-auth.js';

// Global Error Handler
window.onerror = function (message, source, lineno, colno, error) {
    alert(`Global Error: ${message} at ${source}:${lineno}`);
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("Script Loaded - VRIDE");
    // alert("Script Loaded - If you see this, JS is working!");

    // Handle role selection from landing page
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const subheadline = document.querySelector('.subheadline');

    if (role === 'passenger') {
        subheadline.textContent = 'Verify your number to continue as a Passenger.';
    } else {
        subheadline.textContent = 'Verify your number to continue as a Driver.';
    }

    const phoneInput = document.querySelector('.phone-input');
    const sendBtn = document.querySelector('.btn-primary');

    // Focus effect for input group
    phoneInput.addEventListener('focus', () => {
        phoneInput.parentElement.style.border = '1px solid #fff';
    });

    phoneInput.addEventListener('blur', () => {
        phoneInput.parentElement.style.border = 'none';
    });

    // Phone input: Allow only numbers (visual)
    phoneInput.addEventListener('input', (e) => {
        // Only allow digits
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    sendBtn.addEventListener('click', () => {
        if (phoneInput.value.length >= 10) {
            // Redirect to OTP page with E.164 formatted phone number
            const rawValue = phoneInput.value.replace(/\D/g, '');
            const phoneNumber = '+91' + rawValue;

            // Pass role parameter to OTP page
            const urlParams = new URLSearchParams(window.location.search);
            const currentRole = urlParams.get('role') || 'passenger';

            window.location.href = `otp.html?method=phone&value=${encodeURIComponent(phoneNumber)}&role=${currentRole}`;
        } else {
            alert('Please enter a valid phone number.');
        }
    });

    const googleBtn = document.querySelector('.btn-google');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            // alert("Button Clicked!"); // Proof of life

            // Disable button to prevent double click
            const originalText = googleBtn.innerHTML;
            googleBtn.innerHTML = "Working..."; // Visual change
            googleBtn.style.opacity = '0.5';
            googleBtn.style.pointerEvents = 'none';

            try {
                const user = await signInWithGoogle();
                // Save details to localStorage
                localStorage.setItem('vride_user', JSON.stringify(user));

                // Get Role
                const urlParams = new URLSearchParams(window.location.search);
                const currentRole = urlParams.get('role') || 'passenger';
                localStorage.setItem('vride_role', currentRole);

                // Redirect
                window.location.href = 'profile.html';
            } catch (error) {
                alert('Google Login Failed: ' + error.message);
                googleBtn.style.opacity = '1';
                googleBtn.style.pointerEvents = 'auto';
            }
        });
    }
});
