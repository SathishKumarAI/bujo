import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

/**
 * ICON REGISTRY · the app's icon vocabulary, and the only module that imports
 * from `@phosphor-icons/react`.
 *
 * Two reasons it exists rather than letting 85 files import Phosphor directly:
 *
 * - **One place to change the vocabulary.** Swapping the glyph for "delete" or
 *   "migrate" is an edit here, not a sweep. The previous library was imported
 *   directly in 85 files, which is why it had sixteen icon sizes and no way to
 *   answer "what does this app use for a habit?".
 * - **One place to check the noun.** A view that wants an icon picks from this
 *   list; if the noun it needs is missing, the fix is to add it here after
 *   deciding what it means — not to reach into a 1,512-icon library mid-view.
 *
 * Names are Phosphor's own. They are not always the obvious word (`Prohibit`
 * for a ban, `Lifebuoy` for help, `Sword` for a duel), which is exactly why
 * the mapping is written down rather than remembered.
 *
 * Render through `<Icon as={…} />` — never `<Sun />` directly. The wrapper owns
 * size, weight and the active state; a raw glyph bypasses all three.
 */
export type { PhosphorIcon as Icon }

export {
  Alarm, // was AlarmClock
  Archive, // was Archive
  ArrowClockwise, // was RotateCw
  ArrowCounterClockwise, // was RotateCcw
  ArrowLineRight, // was SkipForward
  ArrowLineUp, // was ArrowUpToLine
  ArrowRight, // was ArrowRight
  ArrowSquareOut, // was ExternalLink
  ArrowsClockwise, // was RefreshCw, Repeat
  ArrowsOut, // was Maximize2
  ArrowsVertical, // was MoveVertical
  At, // was AtSign
  Barbell, // was Dumbbell
  Bell, // was Bell
  BookOpen, // was BookOpen
  Bookmark, // was Bookmark
  Books, // was BookMarked
  Brain, // was Brain
  Cake, // was Cake
  CalendarBlank, // was CalendarDays, CalendarRange
  CalendarCheck, // was CalendarCheck
  CalendarDot, // was CalendarClock
  CalendarPlus, // was CalendarPlus
  CalendarX, // was CalendarX
  Camera, // was Camera
  CaretDoubleDown, // was ChevronsDown
  CaretDoubleUp, // was ChevronsUp
  CaretDown, // was ChevronDown
  CaretLeft, // was ChevronLeft
  CaretRight, // was ChevronRight
  CaretUp, // was ChevronUp
  ChartBar, // was BarChart3
  ChartPie, // was PieChart
  ChatCenteredDots, // was MessageSquarePlus
  Check, // was Check
  CheckCircle, // was CheckCircle2
  CheckSquare, // was CheckSquare
  Circle, // shadcn dropdown-menu radio dot
  CircleNotch, // shadcn sonner loading spinner
  ClipboardText, // was ClipboardCheck
  Clock, // was Clock
  Cloud, // was Cloud
  CloudArrowDown, // was CloudDownload
  CloudArrowUp, // was CloudUpload
  CloudCheck, // was CloudCheck, CloudCog
  CloudSlash, // was CloudOff
  CloudWarning, // was CloudAlert
  Code, // was Code2
  Columns, // was Columns2
  Command, // was Command
  Compass, // was Compass
  Crosshair, // was Crosshair
  Database, // was Database
  DotsSixVertical, // was GripVertical
  DotsThree, // was MoreHorizontal
  Download, // was Download
  Drop, // was CupSoda
  Envelope, // was Mail
  Eye, // was Eye
  EyeSlash, // was EyeOff
  FadersHorizontal, // was Settings2
  FileText, // was FileText
  Flag, // was Flag
  Flame, // was Flame
  Flower, // was Flower2
  FolderOpen, // was FolderOpen
  Footprints, // was Footprints
  ForkKnife, // was Utensils
  Gauge, // was Gauge
  Gear, // was Cog
  GitBranch, // was GitBranch
  GraduationCap, // was GraduationCap
  GridFour, // was Grid3x3
  HandFist, // was HandMetal
  HardDrive, // was HardDrive
  Hash, // was Hash
  Heart, // was Heart
  Heartbeat, // was HeartPulse
  Hourglass, // was Hourglass
  Image, // was Image
  Info, // was Info
  Keyboard, // was Keyboard
  Lifebuoy, // was LifeBuoy
  Lightbulb, // was Lightbulb
  Link, // was Link2
  List, // was Menu
  ListChecks, // was ListChecks, ListTodo
  ListNumbers, // was ListOrdered
  Lock, // was Lock
  MagnifyingGlass, // was Search
  MapPin, // was MapPin
  Medal, // was Award, Medal
  Microphone, // was Mic
  MicrophoneSlash, // was MicOff
  Minus, // was Minus
  Moon, // was Moon
  MoonStars, // time-of-day: evening
  Note, // was StickyNote
  NotePencil, // was NotebookPen
  Palette, // was Palette
  Pause, // was Pause
  PencilSimple, // was PenLine
  Person, // was PersonStanding
  PersonSimpleRun, // was Activity
  PiggyBank, // was PiggyBank
  Play, // was Play
  Plus, // was Plus
  Prohibit, // was Ban
  Question, // was HelpCircle
  RadioButton, // was CircleDot
  Scales, // was Scale
  ShareNetwork, // was Share2
  Shield, // was Shield
  ShieldCheck, // was ShieldCheck
  ShieldPlus, // was ShieldPlus
  ShieldWarning, // was ShieldAlert
  Sidebar, // was PanelLeft, PanelLeftOpen
  SidebarSimple, // was PanelLeftClose
  SignIn, // was LogIn
  SignOut, // was LogOut
  SlidersHorizontal, // was Settings, SlidersHorizontal
  Smiley, // was Smile
  Sparkle, // was Sparkles
  Square, // was Square
  SquaresFour, // was LayoutGrid
  Stack, // was Layers
  Star, // was Star
  Sun, // was Sun
  SunHorizon, // time-of-day: morning
  Sword, // was Swords
  Target, // was Target
  Timer, // was Timer
  Trash, // was Trash2
  TrendDown, // was TrendingDown
  TrendUp, // was TrendingUp
  Trophy, // was Trophy
  Upload, // was Upload
  User, // was UserRound
  UserCircle, // was UserCircle2
  UserPlus, // was UserPlus
  Users, // was Users
  Video, // was Video
  Warning, // was AlertTriangle
  Wind, // was Wind
  X, // was X
  XCircle, // shadcn sonner error
} from '@phosphor-icons/react'
