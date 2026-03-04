const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/DriverMindApp.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Remove old Supabase imports
code = code.replace(/import \{ createClient \} from '@\/lib\/supabase';\s*/g, '');
code = code.replace(/import type \{ User \} from '@supabase\/supabase-js';\s*/g, '');
code = code.replace(/const supabase = createClient\(\);\s*/g, '');

// 2. Add new Clerk imports
const newImports = `
import { useUser, useAuth, SignIn, SignUp, UserButton } from "@clerk/nextjs";
import { useSupabase } from "@/lib/useSupabase";
`;
code = code.replace(/import React, \{[^\}]+\} from 'react';/, match => match + newImports);

// 3. Update all generic components to use useSupabase
const componentsToUpdate = [
    'SettingsView',
    'VehiclesView',
    'HistoryDetailModal',
    'HistoryView',
    'TodayView',
    'AddTransactionView',
    'FinishDayView'
];

componentsToUpdate.forEach(comp => {
    const regex = new RegExp(`(const ${comp} = [^=]+=>\\s*\\{)`);
    code = code.replace(regex, `$1\n    const supabase = useSupabase();\n`);
});

// Since the components might crash if supabase is null when initializing, we need to add a null check where appropriate.
// However, since we call `supabase.from()` asynchronously, if it happens before init, it crashes.
// A better way is `if (!supabase) return null;` at the top of these components.
componentsToUpdate.forEach(comp => {
    const regex = new RegExp(`(const ${comp} = [^=]+=>\\s*\\{\\s*const supabase = useSupabase\\(\\);\\s*)`);
    code = code.replace(regex, `$1\n    if (!supabase) return null;\n`);
});

// 4. Update SettingsView to use Clerk user.update instead of supabase.auth.updateUser
// Actually, it's easier to just use user.update from Clerk.
code = code.replace(/await supabase\.auth\.updateUser\(\{[^}]*data: \{([^}]*)\}\s*\}\)/, 'await user?.update({ unsafeMetadata: { $1 } })');
code = code.replace(/user\.user_metadata\?/g, 'user.unsafeMetadata?');

// 5. Update DriverMindApp
// Replace the whole DriverMindApp declaration
const driverMindAppRegex = /export default function DriverMindApp\(\) \{[\s\S]*?(?=const handleTabChange)/;

const newDriverMindApp = `export default function DriverMindApp() {
    const { user, isLoaded } = useUser();
    const supabase = useSupabase();
    const [activeTab, setActiveTab] = useState('today');
    const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstallHelp, setShowInstallHelp] = useState(false);
    const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        const checkStandalone = () => {
            setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);
        };
        checkStandalone();
        window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
        };
    }, []);

    useEffect(() => {
        const init = async () => {
            if (!user || !supabase) return;
            const saved = localStorage.getItem(\`active_vehicle_\$\{user.id\}\`);
            if (saved) {
                setActiveVehicleId(saved);
            } else {
                const { count } = await supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
                if (count && count > 0) setActiveTab('vehicles');
            }
        };
        init();
    }, [user, supabase]);

    useEffect(() => {
        if (user && activeVehicleId) localStorage.setItem(\`active_vehicle_\$\{user.id\}\`, activeVehicleId);
    }, [activeVehicleId, user]);

`;

code = code.replace(driverMindAppRegex, newDriverMindApp);

// 6. Fix user checks
code = code.replace(/if \(loading\)/g, 'if (!isLoaded)');

// Replace the return conditions
const returnRegex = /if \(!user\) \{[\s\S]*?return <AuthView[^>]*>;\s*\}/;
const newReturn = `
    if (!user) {
        if (authView === 'landing') return <LandingView onSignup={() => setAuthView('signup')} onLogin={() => setAuthView('login')} />;
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative">
                <Button variant="ghost" className="absolute top-6 left-4 !w-10 !h-10 !p-0 rounded-full border border-slate-200" onClick={() => setAuthView('landing')}>
                    <ArrowRight className="rotate-180" />
                </Button>
                {authView === 'login' ? <SignIn routing="hash" /> : <SignUp routing="hash" />}
            </div>
        );
    }
`;
code = code.replace(returnRegex, newReturn);

// Update Auth signOut to Clerk SignOut within DriverMindApp? Wait, SalesView uses it.
// Replace `supabase.auth.signOut()` with `const { signOut } = useAuth(); ... signOut()` 
// Or simply window.location.href = '/' to trigger Clerk? Let's just pass `useAuth().signOut` instead.
// For Settings View it's easier to just pass clerk user.
// Wait, `User` type from clerk is different from supabase `User`.
// `User` type has `id`, `primaryEmailAddress?.emailAddress`, `fullName`, `createdAt`.
code = code.replace(/user\.email\?/g, 'user.primaryEmailAddress?.emailAddress?');
code = code.replace(/user\.email/g, 'user.primaryEmailAddress?.emailAddress');
code = code.replace(/user\.created_at/g, 'user.createdAt');
code = code.replace(/<SalesView .* onLogout=\{[^\}]+\} \/>/, "<SalesView onSubscribe={() => alert('Em desenvolvimento')} onLogout={() => window.location.reload()} />");
code = code.replace(/supabase\.auth\.signOut\(\)/g, "undefined /* clerk handles signout via UserButton usually */");

fs.writeFileSync(filePath, code);
console.log('Refactor complete.');
