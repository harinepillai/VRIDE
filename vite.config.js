import { defineConfig } from 'vite';

export default defineConfig({
    publicDir: 'public',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: 'index.html',
                login: 'login.html',
                otp: 'otp.html',
                profile: 'profile.html',
                home: 'home.html',
                locationPicker: 'location-picker.html',
                driverSelection: 'driver-selection.html',
                tracking: 'tracking.html'
            }
        }
    },
    server: {
        port: 8080
    }
});
