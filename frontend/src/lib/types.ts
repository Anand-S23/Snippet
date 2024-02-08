import { z } from 'zod';

export const RegisterSchema = z
    .object({
        email: z
            .string({ required_error: 'Email is required' })
            .max(64, { message: 'Email must be less than 64 characters' })
            .email({ message: 'Email must be a valid email address' }),
        password: z
            .string({ required_error: 'Password is required' })
            .min(8, { message: 'Password must be at least 8 characters' })
            .max(32, { message: 'Password must be less than 32 characters' })
            .trim(),
        confirm: z
            .string({ required_error: 'Confirm Password is required' })
            .trim(),
    })
    .refine((data) => data.password === data.confirm, {
        message: "Passwords must match",
        path: ["confirm"],
    });

export type TRegisterSchema = z.infer<typeof RegisterSchema>;

export const LoginSchema = z
    .object({
        email: z
            .string({ required_error: 'Valid email is required' })
            .email({ message: 'Valid email is required' }),
        password: z
            .string({ required_error: 'Password is required' })
            .min(1, { message: 'Password is required'})
            .trim(),
    });

export type TLoginSchema = z.infer<typeof LoginSchema>;

export interface UserLoginResult {
    User_ID: string;
}

export const CreateRepoSchema = z.
    object({
        name: z
            .string({ required_error: 'Repo name is required' })
            .min(1, { message: 'Repo name is required'})
            .trim(),
        description: z
            .string({ required_error: 'Repo name is required' })
            .min(1, { message: 'Repo name is required'})
            .trim()
})

