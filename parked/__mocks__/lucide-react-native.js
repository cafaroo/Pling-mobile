// Mock för lucide-react-native
const React = require('react');

// Skapa en generisk ikonkomponentfabrik
const createIcon = (name) => {
  const Icon = ({ size = 24, color = 'black', strokeWidth = 2, ...props }) => {
    return React.createElement('view', {
      ...props,
      testID: props.testID || `icon-${name}`,
      style: {
        width: size,
        height: size,
        ...(props.style || {}),
      },
      'data-icon': name,
      'data-color': color,
      'data-size': size,
      'data-stroke-width': strokeWidth,
    });
  };
  Icon.displayName = name;
  return Icon;
};

// Vanliga ikoner som används i appen
const User = createIcon('User');
const Settings = createIcon('Settings');
const Home = createIcon('Home');
const Menu = createIcon('Menu');
const Plus = createIcon('Plus');
const Check = createIcon('Check');
const X = createIcon('X');
const Search = createIcon('Search');
const ArrowLeft = createIcon('ArrowLeft');
const ArrowRight = createIcon('ArrowRight');
const Edit = createIcon('Edit');
const Save = createIcon('Save');
const Trash = createIcon('Trash');
const Info = createIcon('Info');
const Mail = createIcon('Mail');
const Bell = createIcon('Bell');
const Calendar = createIcon('Calendar');
const Clock = createIcon('Clock');
const Star = createIcon('Star');
const Heart = createIcon('Heart');
const Upload = createIcon('Upload');
const Download = createIcon('Download');
const File = createIcon('File');
const Folder = createIcon('Folder');
const Image = createIcon('Image');
const Video = createIcon('Video');
const Audio = createIcon('Audio');
const Link = createIcon('Link');
const Paperclip = createIcon('Paperclip');
const Lock = createIcon('Lock');
const Unlock = createIcon('Unlock');
const Globe = createIcon('Globe');
const Map = createIcon('Map');
const MapPin = createIcon('MapPin');
const Phone = createIcon('Phone');
const Camera = createIcon('Camera');
const Mic = createIcon('Mic');
const Speaker = createIcon('Speaker');
const Play = createIcon('Play');
const Pause = createIcon('Pause');
const Stop = createIcon('Stop');
const FastForward = createIcon('FastForward');
const Rewind = createIcon('Rewind');
const ChevronLeft = createIcon('ChevronLeft');
const ChevronRight = createIcon('ChevronRight');
const ChevronUp = createIcon('ChevronUp');
const ChevronDown = createIcon('ChevronDown');
const UserPlus = createIcon('UserPlus');
const UserMinus = createIcon('UserMinus');
const LogIn = createIcon('LogIn');
const LogOut = createIcon('LogOut');
const Bookmark = createIcon('Bookmark');
const Share = createIcon('Share');
const Send = createIcon('Send');
const MessageCircle = createIcon('MessageCircle');
const MessageSquare = createIcon('MessageSquare');
const RefreshCw = createIcon('RefreshCw');
const RotateCw = createIcon('RotateCw');
const RotateCcw = createIcon('RotateCcw');
const Filter = createIcon('Filter');
const Loader = createIcon('Loader');
const AlertCircle = createIcon('AlertCircle');
const AlertTriangle = createIcon('AlertTriangle');
const HelpCircle = createIcon('HelpCircle');
const Zap = createIcon('Zap');
const Award = createIcon('Award');
const Trophy = createIcon('Trophy');
const PieChart = createIcon('PieChart');
const BarChart = createIcon('BarChart');
const LineChart = createIcon('LineChart');
const Activity = createIcon('Activity');
const DollarSign = createIcon('DollarSign');
const ShoppingCart = createIcon('ShoppingCart');
const Tag = createIcon('Tag');
const Eye = createIcon('Eye');
const EyeOff = createIcon('EyeOff');
const Layers = createIcon('Layers');
const List = createIcon('List');
const Terminal = createIcon('Terminal');
const Code = createIcon('Code');
const Box = createIcon('Box');
const Package = createIcon('Package');
const Users = createIcon('Users');
const Team = createIcon('Team');
const Target = createIcon('Target');
const Goal = createIcon('Goal');

// Exportera alla ikoner
module.exports = {
  // Vanliga navigation/UI ikoner
  User,
  Settings,
  Home,
  Menu,
  Plus,
  Check,
  X,
  Search,
  ArrowLeft,
  ArrowRight,
  Edit,
  Save,
  Trash,
  Info,
  Mail,
  Bell,
  Calendar,
  Clock,
  Star,
  Heart,
  Upload,
  Download,
  File,
  Folder,
  Image,
  Video,
  Audio,
  Link,
  Paperclip,
  Lock,
  Unlock,
  Globe,
  Map,
  MapPin,
  Phone,
  Camera,
  Mic,
  Speaker,
  Play,
  Pause,
  Stop,
  FastForward,
  Rewind,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  UserPlus,
  UserMinus,
  LogIn,
  LogOut,
  Bookmark,
  Share,
  Send,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  RotateCw,
  RotateCcw,
  Filter,
  Loader,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Zap,
  Award,
  Trophy,
  PieChart,
  BarChart,
  LineChart,
  Activity,
  DollarSign,
  ShoppingCart,
  Tag,
  Eye,
  EyeOff,
  Layers,
  List,
  Terminal,
  Code,
  Box,
  Package,
  Users,
  Team,
  Target,
  Goal,
  
  // Hjälpmetod för att skapa ikoner dynamiskt
  createIcon,
}; 