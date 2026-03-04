const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/DriverMindApp.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// The components that use `supabase` but might not have it defined:
const comps = [
    'SettingsView',
    'VehiclesView',
    'HistoryDetailModal',
    'HistoryView',
    'TodayView',
    'AddTransactionView',
    'FinishDayView'
];

comps.forEach(c => {
    // A robust way: find the function declaration, then find the first `{` that opens the body, and inject.
    // Or simpler: replace `const [loading, setLoading]` with `const supabase = useSupabase();\n    const [loading, setLoading]` where applicable.
    // Let's just do a specific string replace for each component where they define state.

    // Fallback if useSupabase is missing:
    if (!code.includes(`const supabase = useSupabase();`) && !code.includes(`export default function ${c}`)) {
        // We'll just manually replace common first lines of these components if they don't have it.
    }
});

// Let's just do it manually with regex for the first useState or useEffect inside the component
comps.forEach(c => {
    const componentRegex = new RegExp(`(const ${c} =[^=]+=>\\s*\\{[\\s\\S]*?)(const \\[)`);
    code = code.replace(componentRegex, (match, p1, p2) => {
        if (!p1.includes('useSupabase')) {
            return p1 + 'const supabase = useSupabase();\n    if (!supabase) return null;\n    ' + p2;
        }
        return match;
    });
});

// Remove duplicate authView
code = code.replace(/const \[authView, setAuthView\] = useState<'landing' \| 'login' \| 'signup'>\('landing'\);\s*const \[authView/g, "const [authView");
code = code.replace(/const handleTabChange = \(tab: string\) => \{\s*setActiveTab\(tab\);\s*setIsMenuOpen\(false\);\s*\};\s*const \[authView, setAuthView\] = useState<'landing' \| 'login' \| 'signup'>\('landing'\);/, "const handleTabChange = (tab: string) => {\n        setActiveTab(tab);\n        setIsMenuOpen(false);\n    };\n");


fs.writeFileSync(filePath, code);
console.log('Fixed missing useSupabase and duplicates.');
