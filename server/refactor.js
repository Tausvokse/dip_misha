const fs = require('fs');
const path = require('path');

// 1. Rewrite schema.prisma
let schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
schema = schema.replace(/enum \w+ \{[\s\S]*?\}/g, '');
schema = schema.replace(/role\s+Role\s+@default\(USER\)/, 'role String @default("USER")');
schema = schema.replace(/status\s+ParkingSpotStatus\s+@default\(FREE\)/, 'status String @default("FREE")');
schema = schema.replace(/type\s+PaymentMethodType/, 'type String');
schema = schema.replace(/brand\s+CardBrand\?/, 'brand String?');
schema = schema.replace(/status\s+ReservationStatus\s+@default\(PENDING_PAYMENT\)/, 'status String @default("PENDING_PAYMENT")');
schema = schema.replace(/Decimal\s+@db\.Decimal\(10, 2\)/, 'Decimal');
fs.writeFileSync('prisma/schema.prisma', schema);

// 2. Create enums file
const enumsContent = `
export const Role = { USER: 'USER', ADMIN: 'ADMIN' } as const;
export type Role = typeof Role[keyof typeof Role];

export const ParkingSpotStatus = { FREE: 'FREE', LOCKED: 'LOCKED', RESERVED: 'RESERVED', MAINTENANCE: 'MAINTENANCE' } as const;
export type ParkingSpotStatus = typeof ParkingSpotStatus[keyof typeof ParkingSpotStatus];

export const ReservationStatus = { PENDING_PAYMENT: 'PENDING_PAYMENT', RESERVED: 'RESERVED', CANCELLED: 'CANCELLED', EXPIRED: 'EXPIRED', COMPLETED: 'COMPLETED' } as const;
export type ReservationStatus = typeof ReservationStatus[keyof typeof ReservationStatus];

export const PaymentMethodType = { CARD: 'CARD', APPLE_PAY: 'APPLE_PAY', GOOGLE_PAY: 'GOOGLE_PAY' } as const;
export type PaymentMethodType = typeof PaymentMethodType[keyof typeof PaymentMethodType];

export const CardBrand = { VISA: 'VISA', MASTERCARD: 'MASTERCARD' } as const;
export type CardBrand = typeof CardBrand[keyof typeof CardBrand];
`;
fs.mkdirSync('src/types', { recursive: true });
fs.writeFileSync('src/types/enums.ts', enumsContent);

// 3. Update imports
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('migrations')) {
                results = results.concat(walk(file));
            }
        } else if (file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('.');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;
    
    if (content.includes('@prisma/client')) {
        const enumsToExtract = ['Role', 'ParkingSpotStatus', 'ReservationStatus', 'PaymentMethodType', 'CardBrand'];
        let importedEnums = [];
        
        enumsToExtract.forEach(e => {
            const regex = new RegExp('import.*\\b' + e + '\\b.*@prisma/client');
            if (regex.test(content)) {
                importedEnums.push(e);
            }
        });
        
        if (importedEnums.length > 0) {
            importedEnums.forEach(e => {
                // Remove the enum from the import list
                content = content.replace(new RegExp('(\\b' + e + '\\b\\s*,?\\s*)'), '');
            });
            
            // Fix trailing commas if it was the last item `import { Prisma, } from`
            content = content.replace(/,\s*\}/g, ' }');
            // Clean up empty imports
            content = content.replace(/import\s*(type\s*)?\{\s*\}\s*from\s*["']@prisma\/client["'];?/g, '');
            
            const fileDir = path.dirname(file);
            const enumsPath = path.resolve('src/types/enums.ts');
            let relativePath = path.relative(fileDir, enumsPath).replace(/\\/g, '/').replace('.ts', '');
            if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
            
            content = `import { ${importedEnums.join(', ')} } from "${relativePath}";\n` + content;
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(file, content);
    }
});

// 4. Update .env
if (fs.existsSync('.env')) {
    let envContent = fs.readFileSync('.env', 'utf-8');
    envContent = envContent.replace(/DATABASE_URL=.*/, 'DATABASE_URL="file:./dev.db"');
    fs.writeFileSync('.env', envContent);
}

console.log('Refactoring complete!');
