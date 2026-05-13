"use client";

import React from "react";
import { AuthBackground } from "@/components/auth/auth-bg";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";

const ContactPage = () => {
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [isPending, setIsPending] = React.useState(false);

    const contactSchema = z.object({
        name: z
            .string()
            .min(2, "Name must be at least 2 characters long")
            .optional(),
        email: z.string().email("Please enter a valid email address"),
        message: z
            .string()
            .min(10, "Message must be at least 10 characters long"),
    });
    type ContactFormData = z.infer<typeof contactSchema>;
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: ContactFormData) => {
        setIsPending(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to send message. Please try again.");
            }

            setSuccess(
                "Message sent successfully! We'll get back to you soon.",
            );
            reset();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred",
            );
        } finally {
            setIsPending(false);
        }
    };
    return (
        <AuthBackground>
            <main className="flex flex-col md:flex-row gap-6 relative min-h-screen items-center justify-center p-8 z-10 md:px-12">
                <div>
                    <h1 className="text-3xl font-bold ">Contact Us</h1>
                    <br />
                    <p className="text-muted-foreground leading-relaxed">
                        Email, call, or complete the form below to learn how
                    </p>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                        Support Agent can help you.
                    </p>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                        john.doe@example.com
                    </p>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                        +1 (555) 123-4567
                    </p>
                    <a
                        href="mailto:support@supportagent.com"
                        className="text-blue-500 underline"
                    >
                        Customer Support
                    </a>
                    <div className="mt-4 flex flex-col md:flex-row gap-4">
                        <div>
                            <h3 className="font-bold">Customer Support</h3>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                For questions about your account, billing, or
                                technical issues, please contact our customer
                                support team.
                            </p>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                support@supportagent.com
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold">
                                Feedback and Suggestions
                            </h3>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                We welcome your feedback and suggestions to help
                                us improve our services.
                            </p>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                feedback@supportagent.com
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold">Partnership Inquiries</h3>
                            <p className="text-muted-foreground mb-2 leading-relaxed">
                                If you're interested in partnering with us,
                                please reach out to our business development
                                team.
                            </p>
                            <p className="text-muted-foreground mb-2 leading-relaxed">
                                partnerships@supportagent.com
                            </p>
                        </div>
                    </div>
                </div>
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Contact Us</CardTitle>
                        <CardDescription>
                            you can reach us anytime
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert className="mb-4 bg-green-50 border-green-200">
                                    <AlertDescription className="text-green-800">
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Your name"
                                        {...register("name")}
                                        disabled={isPending}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        {...register("email")}
                                        disabled={isPending}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Your message here..."
                                        {...register("message")}
                                        disabled={isPending}
                                        // limit the height of the textarea to 150px
                                        className="resize-none h-30 max-h-40"
                                    />
                                    {errors.message && (
                                        <p className="text-sm text-destructive">
                                            {errors.message.message}
                                        </p>
                                    )}
                                </div>
                                <Button type="submit" disabled={isPending}>
                                    Send Message
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </AuthBackground>
    );
};

export default ContactPage;
