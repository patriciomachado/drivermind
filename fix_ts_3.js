const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/DriverMindApp.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace user_metadata and app_metadata with unsafeMetadata / publicMetadata correctly casted
code = code.replace(/user\.user_metadata/g, 'user.unsafeMetadata');
code = code.replace(/user\.app_metadata/g, 'user.publicMetadata');

// Fix type mismatch for numeric metadata
code = code.replace(/user\.publicMetadata\?\.daily_goal/g, '(user.unsafeMetadata?.daily_goal as number)');
code = code.replace(/user\.unsafeMetadata\?\.daily_goal/g, '(user.unsafeMetadata?.daily_goal as number)');
code = code.replace(/user\.publicMetadata\?\.monthly_goal/g, '(user.unsafeMetadata?.monthly_goal as number)');
code = code.replace(/user\.unsafeMetadata\?\.monthly_goal/g, '(user.unsafeMetadata?.monthly_goal as number)');

// Fix type mismatch for string metadata
code = code.replace(/user\.publicMetadata\?\.full_name/g, '(user.unsafeMetadata?.full_name as string)');
code = code.replace(/user\.unsafeMetadata\?\.full_name/g, '(user.unsafeMetadata?.full_name as string)');

// Fix HistoryDetailModal props (vehicles is an object)
// The modal was missing supabase use entirely? The TS error earlier said 35 errors, let's just make sure.
code = code.replace(/(const HistoryDetailModal = [^=]+=>\s*\{)/, `$1\n    const supabase = useSupabase();\n`);

fs.writeFileSync(filePath, code);
console.log('Fixed typings.');
