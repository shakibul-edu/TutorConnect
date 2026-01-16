import {z} from 'zod';

export const formSchema = z.object({
    id: z.string().optional(),
    bio: z.string().min(10, 'Bio must be at least 10 characters long').max(500, 'Bio must be at most 500 characters long'),
    min_salary: z.number().min(500, 'Minimum salary must be at least 500'),
    experience_years: z.number(),
    gender: z.enum(['male', 'female', 'other']),
    teaching_mode: z.enum(['online', 'offline', 'both']),
    subject_list: z.array(z.string()).min(1, 'At least one subject must be selected'),
    medium_list: z.array(z.string()).min(1, 'At least one medium must be selected'),
    grade_list: z.array(z.string()).min(1, 'At least one grade must be selected'),
    preferred_distance: z.number().min(0.5, 'Preferred distance must be at least 0.5 km').max(15, 'Preferred distance must be at most 15 km'),
});

export const availabilitySchema = z.object({
    start: z.string().refine((val) => {
        // Check if val matches HH:mm format (24-hour)
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(val);
    }, {
        message: "Invalid start time format (expected HH:mm)",
    }),
    end: z.string().refine((val) => {
        // Check if val matches HH:mm format (24-hour)
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(val);
    }, {
        message: "Invalid end time format (expected HH:mm)",
    }),
    days: z.array(z.string()).min(1, 'At least one day must be selected'),
});


const MAX_CERT_FILE_MB = 1;
const MAX_CERT_FILE_SIZE = MAX_CERT_FILE_MB * 1024 * 1024;

export const academicProfileSchema = z.object({
    id: z.string().optional(),
    teacher: z.string().optional(),
    institution: z.string().min(1, 'Institution is required'),
    degree: z.string().min(1, 'Degree is required'),
    graduation_year: z.string().regex(/^\d{4}$/, 'Graduation year must be a 4-digit year'),
    results: z.string().min(1, 'Results is required'),
    certificates: z.instanceof(File)
        .refine(file => file.size > 0, 'Certificates file is required')
        .refine(file => file.size <= MAX_CERT_FILE_SIZE, `Certificates file must be at most ${MAX_CERT_FILE_MB} MB`),
    validated: z.boolean(),
});

export const qualificationSchema = z.object({
    id: z.string().optional(),
    teacher: z.string().optional(),
    organization: z.string().min(1, 'Organization is required'),
    skill: z.string().min(1, 'Skill is required'),
    year: z.string().regex(/^\d{4}$/, 'Year must be a 4-digit year'),
    results: z.string().min(1, 'Results is required'),
    certificates: z.instanceof(File)
        .refine(file => file.size > 0, 'Certificates file is required')
        .refine(file => file.size <= MAX_CERT_FILE_SIZE, `Certificates file must be at most ${MAX_CERT_FILE_MB} MB`),
    validated: z.boolean(),
});
