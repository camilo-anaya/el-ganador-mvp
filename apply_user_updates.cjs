const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'app', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// 1. In ClosingSoonDrawCard:
// Replace rawClock / closingClock with safe match and state
const oldClosingSoonCardHead = `function ClosingSoonDrawCard({ draw, onOpen, onBusiness, occupied, progress }: {
  draw: Draw;
  onOpen: (draw: Draw) => void;
  onBusiness: (admin: string) => void;
  occupied: (draw: Draw) => number;
  progress: (draw: Draw) => number;
}) {
  const closingInfo = getClosingTime(draw.id);
  const rawClock = closingInfo.split("·")[1]?.trim() || "Cierra hoy";
  const closingClock = rawClock.replace("Cierra venta en", "Cierra").replace("Cierra venta", "Cierra hoy");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(draw.followers || 2180);
  const [saved, setSaved] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [commentList, setCommentList] = useState<DrawComment[]>([
    {
      id: "cs1",
      author: "Andrés Silva",
      text: "¡Aparté 3 números para hoy! Ojalá caiga aquí en Bogotá 🙏",
      isBuyer: true,
      timeAgo: "Hace 12m",
    },
    {
      id: "cs2",
      author: draw.admin,
      text: "¡Últimas boletas disponibles! Transmisión en vivo ante notaría a la hora fijada 📜",
      isBuyer: false,
      timeAgo: "Hace 5m",
    },
  ]);`;

const newClosingSoonCardHead = `function ClosingSoonDrawCard({ draw, onOpen, onBusiness, occupied, progress }: {
  draw: Draw;
  onOpen: (draw: Draw) => void;
  onBusiness: (admin: string) => void;
  occupied: (draw: Draw) => number;
  progress: (draw: Draw) => number;
}) {
  const closingInfo = getClosingTime(draw.id);
  const rawClock = closingInfo.split("·")[1]?.trim() || "Cierra hoy";
  const match = rawClock.match(/(\\d\\dh\\s*\\d\\dm)/);
  const closingClock = match ? \`Cierra en \${match[1]}\` : rawClock.replace("Cierra venta en", "Cierra").replace("Cierra venta", "Cierra hoy");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(draw.followers || 2180);
  const [copied, setCopied] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);`;

if (!pageContent.includes(oldClosingSoonCardHead)) {
  console.error("COULD NOT FIND oldClosingSoonCardHead");
} else {
  pageContent = pageContent.replace(oldClosingSoonCardHead, newClosingSoonCardHead);
  console.log("REPLACED oldClosingSoonCardHead");
}

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log("Step 1 done");
