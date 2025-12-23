import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

console.log("Firebase loaded");

const firebaseConfig = {
    apiKey: "AIzaSyA8au0zCE_bXYzFe1L53hrAiNDnSQdpVTc",
    authDomain: "vride-letsgetmoving.firebaseapp.com",
    projectId: "vride-letsgetmoving",
    storageBucket: "vride-letsgetmoving.firebasestorage.app",
    messagingSenderId: "1076732337676",
    appId: "1:1076732337676:web:3b1922a4419952e5c2d829",
    measurementId: "G-17QZLWTQWF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Recaptcha Container is now in otp.html

document.addEventListener('DOMContentLoaded', () => {
    // UI Logic (Preserved from otp.js)
    const urlParams = new URLSearchParams(window.location.search);
    const method = urlParams.get('method');
    const value = urlParams.get('value');

    const userContact = document.getElementById('user-contact');
    if (userContact) {
        if (value) {
            userContact.textContent = value;
        } else {
            userContact.textContent = 'your device';
        }
    }

    // OTP Input Logic
    const inputs = document.querySelectorAll('.otp-input');
    const verifyBtn = document.getElementById('verify-btn');

    inputs.forEach((input, index) => {
        // Handle Input
        input.addEventListener('input', (e) => {
            if (e.target.value.length > 1) {
                e.target.value = e.target.value.slice(0, 1);
            }
            if (e.target.value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            }
        });

        // Handle Backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });

        // Handle Paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').slice(0, inputs.length).split('');
            if (pastedData.every(char => !isNaN(char))) {
                pastedData.forEach((char, i) => {
                    if (inputs[i]) inputs[i].value = char;
                });
                inputs[Math.min(pastedData.length, inputs.length) - 1].focus();
            }
        });
    });

    // Verify Button Logic
    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => {
            let code = '';
            inputs.forEach(input => code += input.value);

            if (code.length === 6) {
                // Firebase Verification
                if (window.confirmationResult) {
                    window.confirmationResult.confirm(code).then((result) => {
                        // User signed in successfully.
                        const user = result.user;

                        // Save user data to localStorage
                        const userData = {
                            name: user.phoneNumber || 'User', // Phone users won't have a display name
                            email: user.email || '',
                            photoURL: user.photoURL || 'https://via.placeholder.com/100',
                            uid: user.uid,
                            phoneNumber: user.phoneNumber
                        };
                        localStorage.setItem('vride_user', JSON.stringify(userData));

                        // Get role from URL or default to passenger
                        const urlParams = new URLSearchParams(window.location.search);
                        const role = urlParams.get('role') || 'passenger';
                        localStorage.setItem('vride_role', role);

                        // Redirect to profile page
                        window.location.href = 'profile.html';
                    }).catch((error) => {
                        // User couldn't sign in (bad verification code?)
                        alert('Error verifying code: ' + error.message);
                    });
                } else {
                    alert(`Dev Mode: You entered ${code}. (SMS not sent because Recaptcha/Phone flow not triggered properly or blocked)`);
                }
            } else {
                alert('Please enter a complete 6-digit code.');
            }
        });
    }

    // Resend Logic
    const resendLink = document.getElementById('resend-link');
    if (resendLink) {
        resendLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger code resend logic here
            if (method === 'phone' && value) {
                startPhoneAuth(value);
            }
        });
    }

    // Auto-send verification code if method is phone
    if (method === 'phone' && value) {
        startPhoneAuth(value);
    }

    function startPhoneAuth(phoneNumber) {
        // Ensure Recaptcha is initialized
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                    console.log("Recaptcha verified");
                }
            });
        }

        console.log("Sending code to: " + phoneNumber);
        signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
            .then((confirmationResult) => {
                // SMS sent. Prompt user to type the code from the message, then sign the
                // user in with confirmationResult.confirm(code).
                window.confirmationResult = confirmationResult;
                console.log("SMS sent!");
                alert("SMS sent to " + phoneNumber);
            }).catch((error) => {
                // Error; SMS not sent
                console.error("SMS Error:", error);
                alert("Could not send SMS: " + error.message);
                // Reset Recaptcha
                if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
            });
    }
});

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        return {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            uid: user.uid
        };
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        throw error;
    }
}
