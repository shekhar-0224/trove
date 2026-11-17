// The appreciation layer: one-time recognitions for meaningful moments. No points, no streaks.
export const BADGES = {
  first_save: { title: "First spark", line: "You saved your first find. We'll let you know before it goes live.", hue: "#ff6a3d", icon: "M12 20.5s-8-4.7-8-10.4A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 8 2.4c0 5.7-8 10.4-8 10.4z" },
  first_bid: { title: "Paddle up", line: "Your first bid. Every collection starts with one.", hue: "#0a7cff", icon: "M9 3h6a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-1v6a2 2 0 0 1-4 0v-6H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" },
  in_the_room: { title: "In the room", line: "You bid live with the room watching.", hue: "#e03131", icon: "M4 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm12 3 4-3v10l-4-3z" },
  first_win: { title: "Found it", line: "Your first win. This one's yours.", hue: "#b08300", icon: "M7 4h10v3a5 5 0 0 1-10 0zM5 5H3v2a4 4 0 0 0 4 4M19 5h2v2a4 4 0 0 1-4 4M12 12v4m-4 4h8l-1-4H9z" },
  sharp_eye: { title: "Sharp eye", line: "You called the hammer within 10%. You know your market.", hue: "#1a8f4c", icon: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  curator: { title: "Curator", line: "Five saves across three categories. You've got range.", hue: "#8e5bd6", icon: "M4 5h7v7H4zm9 0h7v7h-7zM4 14h7v5H4zm9 0h7v5h-7z" },
  plus_one: { title: "Plus one", line: "You shared a find. Collecting is better together.", hue: "#12a3b0", icon: "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-3 0-6 1.5-6 4v1h12v-1c0-2.5-3-4-6-4zm8 0c-.6 0-1.2.1-1.8.2 1.1.9 1.8 2.1 1.8 3.8v1h6v-1c0-2.5-3-4-6-4z" },
  supporter: { title: "Supporter", line: "You followed a seller. Their next drop lands in your feed first.", hue: "#1d1d1f", icon: "M12 2l2.9 6.2 6.8.7-5.1 4.6 1.5 6.7L12 16.8 5.9 20.2l1.5-6.7L2.3 8.9l6.8-.7z" }
};
export const BADGE_ORDER = Object.keys(BADGES);
