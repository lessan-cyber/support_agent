import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { ReplyIcon, ForwardIcon } from "lucide-react";

function MessageHeader(user: {
  name: string;
  email: string;
  avatar: string;
}) {
  return <div className="flex flex-row justify-between">
    <div>
        <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs">{user.email}</span>
        </div>
    </div>
    <div>
        {/* Placeholder for message actions like reply, forward, etc. */}
        <Button variant="ghost" size="icon">
            <ReplyIcon />
        </Button>
        <Button variant="ghost" size="icon">
            <ForwardIcon />
        </Button>
    </div>
  </div>;
}


function MessageBody(content: string) {
  return <div className="mt-4 text-sm text-gray-700">
    {content}
  </div>;
}

function MessageFooter(date: string) {
  return <div className="mt-4 text-xs text-gray-500">
    Sent on: {date}
  </div>;
}

export function MessageComponent({
  user,
  content,
  date,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  content: string;
  date: string;
}) {
  return (
    <div className="p-4 border-b border-gray-200">
      {MessageHeader(user)}
      {MessageBody(content)}
      {MessageFooter(date)}
    </div>
  );
}