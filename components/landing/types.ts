import { LucideIcon } from 'lucide-react';

export interface Feature {
    id: number;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
}

export interface Testimonial {
    id: number;
    name: string;
    role: string;
    content: string;
    avatar: string;
}
