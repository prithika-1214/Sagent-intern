import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import {
  Box,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { STORAGE_KEYS } from "../../constants/appConstants";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  buildAssistantContext,
  isPortalQuery,
  tryAnswerFromSnapshot,
} from "../../services/assistantContextService";
import { askAssistant } from "../../services/aiAssistantService";

const WELCOME_TEXT =
  "Hi! Ask me anything. I can fetch your portal records too. Try: show all my records, list my applications, or app id 18 details.";

const createMessage = (role, content) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
});

const createWelcomeMessages = () => [createMessage("assistant", WELCOME_TEXT)];

const getSessionKey = ({ isAuthenticated, role, user }) =>
  isAuthenticated
    ? `${String(role || "").toUpperCase()}|${String(user?.userId ?? user?.email ?? "unknown")}`
    : "LOGGED_OUT";

const readChatStore = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.ASSISTANT_CHAT_SESSIONS) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const writeChatStore = (store) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.ASSISTANT_CHAT_SESSIONS, JSON.stringify(store));
};

const clearAllStoredChats = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS.ASSISTANT_CHAT_SESSIONS);
};

const toStoredMessage = (message) => ({
  role: message?.role === "user" ? "user" : "assistant",
  content: String(message?.content || ""),
});

const toRuntimeMessages = (storedMessages = []) =>
  storedMessages
    .filter((message) => typeof message?.content === "string" && message.content.trim())
    .map((message) => createMessage(message.role === "user" ? "user" : "assistant", message.content));

const loadSessionMessages = (sessionKey) => {
  const store = readChatStore();
  const storedMessages = Array.isArray(store?.[sessionKey]) ? store[sessionKey] : [];
  const runtimeMessages = toRuntimeMessages(storedMessages);
  return runtimeMessages.length ? runtimeMessages : createWelcomeMessages();
};

const saveSessionMessages = (sessionKey, messages) => {
  const store = readChatStore();
  const sanitized = messages.map((message) => toStoredMessage(message)).slice(-100);
  store[sessionKey] = sanitized;
  writeChatStore(store);
};

const AIAssistant = () => {
  const { user, role, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState(createWelcomeMessages);
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef(null);
  const sessionKeyRef = useRef("");
  const skipPersistRef = useRef(false);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isLoading, open]);

  useEffect(() => {
    const sessionKey = getSessionKey({ isAuthenticated, role, user });

    if (sessionKeyRef.current === sessionKey) {
      return;
    }

    const previousSessionKey = sessionKeyRef.current;
    sessionKeyRef.current = sessionKey;
    skipPersistRef.current = true;

    if (sessionKey === "LOGGED_OUT") {
      clearAllStoredChats();
      setMessages(createWelcomeMessages());
    } else {
      const nextMessages =
        previousSessionKey === "LOGGED_OUT"
          ? createWelcomeMessages()
          : loadSessionMessages(sessionKey);
      setMessages(nextMessages);
    }

    setPrompt("");
    setIsLoading(false);
    setOpen(false);
  }, [isAuthenticated, role, user?.email, user?.userId]);

  useEffect(() => {
    const sessionKey = getSessionKey({ isAuthenticated, role, user });
    if (sessionKey === "LOGGED_OUT") {
      return;
    }

    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    saveSessionMessages(sessionKey, messages);
  }, [isAuthenticated, messages, role, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const question = prompt.trim();

    if (!question || isLoading) {
      return;
    }

    const userMessage = createMessage("user", question);
    const previousHistory = [...messages];
    let latestSnapshot = null;

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    try {
      const { snapshot, context } = await buildAssistantContext({
        user,
        role,
      });
      latestSnapshot = snapshot;

      const localAnswer = tryAnswerFromSnapshot({ question, snapshot });
      if (localAnswer) {
        setMessages((prev) => [...prev, createMessage("assistant", localAnswer)]);
        return;
      }

      const answer = await askAssistant({
        question,
        history: previousHistory,
        context,
      });
      setMessages((prev) => [...prev, createMessage("assistant", answer)]);
    } catch (error) {
      const rawMessage = String(error?.message || "");
      const isQuotaIssue = /quota|rate limit|billing|api key|permission denied/i.test(rawMessage);
      const emergencyLocalAnswer =
        latestSnapshot && tryAnswerFromSnapshot({ question, snapshot: latestSnapshot });

      const fallbackMessage =
        emergencyLocalAnswer ||
        (isPortalQuery(question)
          ? "I can answer portal data directly. Ask about applications, courses, payments, documents, status, flow, or app ID for exact details."
          : isQuotaIssue
            ? "General AI answers are temporarily unavailable due API quota. Ask a portal-specific question and I will answer from your application data."
            : "I could not complete that request right now. Please try again.");

      setMessages((prev) => [...prev, createMessage("assistant", fallbackMessage)]);
    } finally {
      setIsLoading(false);
    }
  };

  const canSend = Boolean(prompt.trim()) && !isLoading;

  return (
    <Box
      sx={{
        position: "fixed",
        right: { xs: 16, sm: 24 },
        bottom: { xs: 16, sm: 24 },
        zIndex: (theme) => theme.zIndex.drawer + 3,
      }}
    >
      {open ? (
        <Paper
          elevation={12}
          sx={{
            mb: 1.5,
            width: { xs: "calc(100vw - 32px)", sm: 390 },
            maxWidth: "95vw",
            height: { xs: "70vh", sm: 520 },
            borderRadius: 3,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                AI Assistant
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Ask anything
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "inherit" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Stack
            ref={listRef}
            spacing={1.25}
            sx={{
              p: 1.5,
              flexGrow: 1,
              overflowY: "auto",
              bgcolor: "background.default",
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Paper
                  sx={{
                    px: 1.25,
                    py: 1,
                    maxWidth: "85%",
                    bgcolor: message.role === "user" ? "primary.main" : "grey.100",
                    color: message.role === "user" ? "primary.contrastText" : "text.primary",
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            ))}

            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                <Paper sx={{ px: 1.25, py: 1, bgcolor: "grey.100" }}>
                  <Typography variant="body2" color="text.secondary">
                    Thinking...
                  </Typography>
                </Paper>
              </Box>
            ) : null}
          </Stack>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 1.25,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              gap: 1,
              alignItems: "flex-end",
            }}
          >
            <TextField
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              fullWidth
              multiline
              maxRows={4}
              size="small"
              placeholder="Ask your question..."
            />
            <IconButton type="submit" color="primary" disabled={!canSend}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      ) : null}

      <Tooltip title={open ? "Close assistant" : "Open assistant"}>
        <Fab color="primary" onClick={() => setOpen((prev) => !prev)} aria-label="ai-assistant">
          {open ? <CloseIcon /> : <SmartToyIcon />}
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default AIAssistant;
