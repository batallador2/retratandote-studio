import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";

export default function MessagesCard({ weddingId, messages, sender = "fotografo", onChanged, onSend }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    if (onSend) {
      await onSend(text.trim());
    } else {
      await base44.entities.ClientMessage.create({ wedding_id: weddingId, sender, content: text.trim() });
    }
    setText("");
    setSending(false);
    onChanged();
  };

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#C9A84C]" /> Mensajes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {messages.length === 0 && <p className="text-sm text-stone-400">Sin mensajes todavía.</p>}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3 rounded-lg text-sm max-w-[85%] ${
                m.sender === sender ? "ml-auto bg-[#1A1A18] text-white" : "bg-stone-100 text-[#1A1A18]"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className={`text-[10px] mt-1 ${m.sender === sender ? "text-stone-400" : "text-stone-500"}`}>
                {m.sender === "cliente" ? "Cliente" : "Fotógrafo"} · {format(new Date(m.created_date), "dd/MM HH:mm")}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje…"
            rows={2}
            className="resize-none"
          />
          <Button onClick={send} disabled={sending || !text.trim()} className="bg-[#1A1A18] hover:bg-stone-800 self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}