'use client';

import React, { useState } from 'react';
import { forwardRef } from "react";
import { Send, MessageCircle, Check, AlertCircle } from 'lucide-react';

export function AhaDemo() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatState, setChatState] = useState('idle');
  const [messages, setMessages] = useState<Array<{ role: 'bot' | 'user'; text: string }>>([]);
  const [quickReplies, setQuickReplies] = useState<Array<{ label: string; key: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [humanRequested, setHumanRequested] = useState(false);
  const [dashboardUpdated, setDashboardUpdated] = useState(false);
  const [showLiveConv, setShowLiveConv] = useState(false);
  const [activeScene, setActiveScene] = useState('chat');
  const [liveConvMessages, setLiveConvMessages] = useState<Array<{ role: string; from: string; text: string }>>([]);
  const [agentTakenOver, setAgentTakenOver] = useState(false);

  const scenarios = {
    retour: [
      'Notre politique de retour vous permet de retourner tout article sous **30 jours** après réception. 📦',
      'Les articles doivent être dans leur état d\'origine avec l\'emballage intact. Le remboursement est traité sous 5 jours ouvrés.',
      'Avez-vous une commande spécifique à retourner ? Je peux vous aider à initier la procédure.',
    ],
    humain: [
      'Bien sûr, je comprends. Je vais alerter un de nos agents. 🔔',
      'Votre demande est transmise. Un agent va vous répondre dans les 2-3 minutes.',
      'En attendant, y a-t-il quelque chose d\'autre que je peux faire pour vous ?',
    ],
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (!chatOpen && chatState === 'idle') {
      startConversation();
      setChatState('started');
    }
  };

  const startConversation = () => {
    setMessages([]);
    setTimeout(() => {
      addMsg('bot', 'Bonjour 👋 Bienvenue sur ShopIA ! Testez-moi — posez-moi une question sur notre politique de retour, ou demandez à parler à un humain.');
      setQuickReplies([
        { label: '↩ Politique de retour', key: 'retour' },
        { label: '👤 Parler à un humain', key: 'humain' },
      ]);
    }, 800);
  };

  const addMsg = (role: 'bot' | 'user', text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const handleQuickReply = (key: string, label: string) => {
    addMsg('user', label);
    setQuickReplies([]);
    if (key === 'retour') {
      handleRetour();
    } else if (key === 'humain') {
      handleHumain();
    }
  };

  const handleRetour = () => {
    const replies = scenarios.retour;
    let i = 0;
    const next = () => {
      if (i < replies.length) {
        setTimeout(() => {
          addMsg('bot', replies[i]);
          i++;
          setTimeout(next, 400);
        }, 700 + i * 100);
      } else {
        setQuickReplies([
          { label: '👤 Parler à un humain', key: 'humain' },
          { label: '📦 Initier un retour', key: 'retour2' },
        ]);
      }
    };
    next();
  };

  const handleHumain = () => {
    setHumanRequested(true);
    const replies = scenarios.humain;
    let i = 0;
    const next = () => {
      if (i < replies.length) {
        setTimeout(() => {
          addMsg('bot', replies[i]);
          i++;
          setTimeout(next, 500);
        }, 600);
      } else {
        if (!dashboardUpdated) {
          setDashboardUpdated(true);
          setTimeout(triggerDashboardUpdate, 1200);
        }
        setQuickReplies([{ label: '📊 Voir le dashboard →', key: 'showdash' }]);
      }
    };
    next();
  };

  const sendUserMsg = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    addMsg('user', text);
    const lower = text.toLowerCase();
    if (lower.includes('retour') || lower.includes('remboursement')) {
      setTimeout(handleRetour, 300);
    } else if (lower.includes('humain') || lower.includes('agent') || lower.includes('personne')) {
      setTimeout(handleHumain, 300);
    } else {
      setTimeout(() => {
        addMsg('bot', 'Je peux vous aider avec notre politique de retour ou vous connecter à un agent humain. Que souhaitez-vous ?');
        setQuickReplies([
          { label: '↩ Politique de retour', key: 'retour' },
          { label: '👤 Parler à un humain', key: 'humain' },
        ]);
      }, 800);
    }
  };

  const triggerDashboardUpdate = () => {
    setShowLiveConv(true);
    const convo = [
      { role: 'from-user', from: 'Visiteur', text: 'Bonjour, politique de retour ?' },
      { role: 'from-bot', from: 'ShopIA IA', text: 'Les articles doivent être dans leur état d\'origine. Remboursement sous 5 jours.' },
      { role: 'from-user', from: 'Visiteur', text: 'Ok. Je voudrais parler à un humain.' },
      { role: 'from-bot', from: 'ShopIA IA', text: 'Bien sûr, transfert en cours... 🔔' },
    ];
    let i = 0;
    const addConvMsg = () => {
      if (i < convo.length) {
        setTimeout(() => {
          setLiveConvMessages((prev) => [...prev, convo[i]]);
          i++;
          addConvMsg();
        }, 200);
      }
    };
    addConvMsg();
  };

  const agentTakeover = () => {
    setLiveConvMessages((prev) => [...prev, { role: 'from-human-agent', from: 'Vous (Agent)', text: 'Bonjour Alex, je prends en charge votre demande. Comment puis-je vous aider ?' }]);
    setAgentTakenOver(true);
  };

  return (
    <div className="w-full min-h-screen bg-linear-to-b from-slate-300/95 to-slate-200/95 rounded-2xl p-8 flex flex-col gap-6 dark:bg-linear-to-b dark:from-slate-900/95 dark:to-slate-800/95" >
    
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 text-center">
        Démo interactive · Scénario e-commerce
      </p>

      {/* Navigation */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setActiveScene('chat')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
            activeScene === 'chat'
              ? 'bg-slate-900 text-white border border-slate-900'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
          }`}
        >
          Vue visiteur
        </button>
        <button
          onClick={() => setActiveScene('dashboard')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
            activeScene === 'dashboard'
              ? 'bg-slate-900 text-white border border-slate-900'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
          }`}
        >
          Vue e-commerçant
        </button>
      </div>

      {/* Chat Scene */}
      {activeScene === 'chat' && (
        <div className="flex flex-row gap-8 flex-wrap">
          <div className="flex-1 min-w-56 bg-background rounded-2xl p-6 min-h-96 relative">
            {/* Fake Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-7 h-7 bg-slate-900 rounded text-white text-xs font-semibold flex items-center justify-center">
                S
              </div>
              <div className="flex gap-2 flex-1">
                <span className="text-xs text-accent-foreground font-medium">Boutique</span>
                <span className="text-xs text-muted-foreground">Catégories</span>
                <span className="text-xs text-muted-foreground">Offres</span>
              </div>
            </div>

            {/* Fake Hero */}
            <div className="mb-4">
              <div className="w-2/3 h-4 bg-ring/50 rounded mb-2"></div>
              <div className="w-1/2 h-2 bg-ring/50 rounded"></div>
            </div>

            {/* Fake Products */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-ring/30 rounded-lg p-2">
                  <div className="w-full h-10 bg-ring/50 rounded mb-2"></div>
                  <div className="w-4/5 h-1.5 bg-ring/50 rounded mb-1"></div>
                  <div className="w-1/2 h-1.5 bg-ring/60 rounded"></div>
                </div>
              ))}
            </div>

            {/* Chat Widget */}
            <div className="absolute bottom-4 right-4 w-64">
              {chatOpen && (
                <div className="bg-background border border-border rounded-3xl overflow-hidden flex flex-col max-h-80 mb-2">
                  <div className="bg-muted-foreground px-3 py-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                      S
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-accent-foreground">Support ShopIA</p>
                      <span className="text-xs text-green-400">● En ligne</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`max-w-xs text-xs p-2 rounded-2xl ${
                          msg.role === 'bot'
                            ? 'bg-accent text-accent-foreground rounded-bl'
                            : 'bg-accent-foreground text-accent rounded-br self-end'
                        }`}
                      >
                        {msg.text.replace(/\*\*(.*?)\*\*/g, (_, p1) => p1)}
                      </div>
                    ))}
                  </div>

                  {quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-2.5 pb-2">
                      {quickReplies.map((qr) => (
                        <button
                          key={qr.key}
                          onClick={() => handleQuickReply(qr.key, qr.label)}
                          className="text-xs px-2 py-1 border border-ring/60 rounded-full bg-background text-slate-600 hover:bg-slate-100 hover:border-slate-900 hover:text-slate-900 transition-all"
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1.5 p-2 border-t border-ring/50">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendUserMsg()}
                      placeholder="Écrivez un message..."
                      className="flex-1 border border-ring/60 rounded-xl px-2 py-1.5 text-xs bg-slate-100 text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <button
                      onClick={sendUserMsg}
                      className="bg-slate-900 text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      ↑
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={toggleChat}
                className="w-11 h-11 bg-slate-900 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform relative ml-auto"
              >
                <MessageCircle size={20} />
                {!chatOpen && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Scene */}
      {activeScene === 'dashboard' && (
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-[11px] font-semibold">
                S
              </div>
              <span className="text-sm font-semibold text-foreground">
                ShopIA <span className="text-xs text-muted-foreground font-normal">Dashboard</span>
              </span>
            </div>
            {dashboardUpdated && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium px-3 py-2 rounded-full">
                <Check size={12} />
                Nouveau ticket — demande humain
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Conversations aujourd\'hui', value: '47', delta: '↑ +12 depuis hier' },
              { label: 'Résolu par l\'IA', value: '91%', delta: '↑ +3% cette semaine' },
              { label: 'Escalades humaines', value: dashboardUpdated ? '5' : '4', delta: dashboardUpdated ? '● 1 en attente' : '● 0 en attente', deltaColor: dashboardUpdated ? 'text-amber-600' : 'text-slate-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-background/50 border border-ring/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                <div className="text-2xl font-medium text-foreground">{stat.value}</div>
                <div className={`text-xs mt-1 ${stat.deltaColor || 'text-green-600'}`}>{stat.delta}</div>
              </div>
            ))}
          </div>

          {/* Tickets */}
          <div className="bg-background/50 border border-ring/50 rounded-2xl overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-ring/50 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Tickets récents</span>
              {dashboardUpdated && (
                <span className="text-xs font-semibold bg-red-50 text-red-900 px-2 py-1 rounded-full">● Nouveau</span>
              )}
            </div>
            <div className="divide-y divide-slate-200">
              {dashboardUpdated && (
                <div className="p-3 hover:bg-amber-50 transition-colors highlight-animation">
                  <div className="flex gap-2.5 items-start">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-medium text-xs flex items-center justify-center shrink-0">
                      AT
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-900">
                        Alex T. <span className="text-slate-500 font-normal">● Nouveau</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">"Je voudrais parler à un humain..."</div>
                      <div className="text-xs text-slate-400 mt-1 flex gap-2">
                        <span>À l'instant</span>
                        <span>via widget démo</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-amber-50 text-amber-900 px-2 py-1 rounded-full shrink-0">
                      Humain requis
                    </span>
                  </div>
                </div>
              )}
              <div className="p-3 hover:bg-foreground/10 transition-colors">
                <div className="flex gap-2.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-medium text-xs flex items-center justify-center shrink-0">
                    IA
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground">Marie D.</div>
                    <div className="text-xs text-muted-foreground mt-1">Délai de livraison pour la Corse ?</div>
                    <div className="text-xs text-muted-foreground mt-1">il y a 8 min</div>
                  </div>
                  <span className="text-xs font-medium bg-green-50 text-green-900 px-2 py-1 rounded-full shrink-0">
                    Résolu
                  </span>
                </div>
              </div>
              <div className="p-3 hover:bg-foreground/10 transition-colors">
                <div className="flex gap-2.5 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-medium text-xs flex items-center justify-center shrink-0">
                    IA
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground">Lucas M.</div>
                    <div className="text-xs text-muted-foreground mt-1">Comment suivre ma commande #4521 ?</div>
                    <div className="text-xs text-muted-foreground mt-1">il y a 22 min</div>
                  </div>
                  <span className="text-xs font-medium bg-green-50 text-green-900 px-2 py-1 rounded-full shrink-0">
                    Résolu
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Conversation */}
          {showLiveConv && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">Conversation en direct — Alex T.</span>
                <button
                  onClick={agentTakeover}
                  disabled={agentTakenOver}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    agentTakenOver
                      ? 'bg-green-100 text-green-900'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {agentTakenOver ? '✓ Pris en charge' : 'Prendre en charge →'}
                </button>
              </div>
              <div className="p-3 flex flex-col gap-2 max-h-48 overflow-y-auto">
                {liveConvMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-xs p-2 rounded-lg max-w-xs ${
                      msg.role === 'from-user'
                        ? 'bg-slate-100 text-slate-900 self-start'
                        : msg.role === 'from-bot'
                        ? 'bg-blue-100 text-blue-900 self-start'
                        : 'bg-slate-900 text-white self-end'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">{msg.from}</div>
                    {msg.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
