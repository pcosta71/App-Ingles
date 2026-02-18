import React, { useEffect, useRef } from 'react';
import { MessageSender, type TranscriptMessage } from '../types';
import { TutorIcon } from './Icons';
import UserAvatar from './UserAvatar';

interface TranscriptProps {
  messages: TranscriptMessage[];
  userAvatar: string;
}

const Transcript: React.FC<TranscriptProps> = ({ messages, userAvatar }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="space-y-6">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === MessageSender.User ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === MessageSender.AI && (
                         <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                            <TutorIcon className="w-6 h-6" />
                        </div>
                    )}
                    <div className={`max-w-md p-4 rounded-xl shadow-md ${
                        msg.sender === MessageSender.User 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                        }`}
                    >
                        <p className="whitespace-pre-wrap">{msg.text || "..."}</p>
                    </div>
                     {msg.sender === MessageSender.User && (
                         <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white overflow-hidden">
                            <UserAvatar avatar={userAvatar} className="w-10 h-10 object-cover" />
                        </div>
                    )}
                </div>
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
};

export default Transcript;
