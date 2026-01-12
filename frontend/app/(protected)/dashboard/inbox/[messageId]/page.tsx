import { MessageComponent } from "@/components/dashboard/message";

export default function Message() {
    return <div>
        <MessageComponent user={{name: "John Doe", email: "john.doe@example.com", avatar: "/avatars/01.png"}} content="This is a sample message." date="2023-10-15" />
    </div>
}