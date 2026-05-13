// app/(protected)/dashboard/inbox/[messageId]/page.tsx
"use client"
// get messageId from url params and display it in the page
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/dist/client/components/navigation"
import { useEffect } from "react"
import { MessageComponent } from "@/components/dashboard/message";

export default function Message() {
    const searchParams = useSearchParams()
    const messageId = searchParams.get('messageId')
    const router = useRouter()

    useEffect(() => {
        if (!messageId) {
            router.push("/dashboard/inbox")
        }
    }, [messageId, router])
    return <div>
        <MessageComponent user={{name: "John Doe", email: "john.doe@example.com", avatar: "/avatars/01.png"}} content="This is a sample message." date="2023-10-15" />
    </div>
}