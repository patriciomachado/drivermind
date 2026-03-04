const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/DriverMindApp.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// The issue is:
// const supabase = useSupabase();
// if (!supabase) return null;
// ... hooks ...

// We need to move `if (!supabase) return null;` to just before the first `return (` or after all hooks.
// Actually, it's easier to just remove it and ensure `!supabase` is checked in useEffects and event handlers,
// or just put a generic loading state if `!supabase`.
// But an early return before `return (` is best.

// Let's manually replace it component by component since there's only a few.
const replacements = [
    {
        name: 'VehiclesView',
        find: /const supabase = useSupabase\(\);\s*if \(!supabase\) return null;\s*const \[vehicles/g,
        replace: 'const supabase = useSupabase();\n    const [vehicles'
    },
    {
        name: 'HistoryDetailModal',
        // In HistoryDetailModal:
        // const supabase = useSupabase();
        // if (!day || !supabase) return null;
        find: /const supabase = useSupabase\(\);\s*if \(!day \|\| !supabase\) return null;/g,
        replace: 'const supabase = useSupabase();\n    if (!day) return null;'
    },
    {
        name: 'HistoryView',
        find: /const supabase = useSupabase\(\);\s*if \(!supabase\) return null;/g,
        replace: 'const supabase = useSupabase();'
    },
    {
        name: 'SettingsView',
        find: /const supabase = useSupabase\(\);\s*if \(!supabase\) return null;/g,
        replace: 'const supabase = useSupabase();'
    }
];

replacements.forEach(r => {
    code = code.replace(r.find, r.replace);
});

// For TodayView, AddTransactionView, FinishDayView, we injected `const supabase = useSupabase();` but we didn't inject `if (!supabase) return null;` right after it. Wait, did we? We need to check.
// Let's just remove ALL `    if (!supabase) return null;\n` globally and rely on the fallback I added later: `if (!supabase) return <div ...>Carregando...</div>;` which might also be before hooks if not careful!

// Let's just do a manual inspection of early returns before hooks.
fs.writeFileSync(filePath, code);
console.log('Fixed early returns.');
