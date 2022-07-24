import { ClipboardIcon } from "~/icons/clipboard-icon";
import DiscogsIcon from "~/icons/discogs-icon";
import { RadioIcon } from "~/icons/radio-icon";
import { YoutubeIcon } from "~/icons/youtube";

export const navigation = [
  { name: "Youtube", href: "youtube", icon: YoutubeIcon },
  { name: "NTS", href: "nts", icon: RadioIcon },
  { name: "Discogs", href: "discogs", icon: DiscogsIcon },
  {
    name: "Copy/Paste",
    href: "copy-paste",
    icon: ClipboardIcon,
  },
];
