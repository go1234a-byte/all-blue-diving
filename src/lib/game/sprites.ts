// Infinite Dive — pixel art sprite asset registry (AI-generated, transparent PNG)

export const SPRITES = {
  diverDefault: "https://cdn.enter.pro/resources/uid_100187712/diver_default_bcd16659.png",
  diverLegendary: "https://cdn.enter.pro/resources/uid_100187712/diver_legendary_85fd8415.png",
  coralReef: "https://cdn.enter.pro/resources/uid_100187712/obstacle_coral_reef_61245e44.png",
  seaweed: "https://cdn.enter.pro/resources/uid_100187712/obstacle_seaweed_d318b424.png",
  anchor: "https://cdn.enter.pro/resources/uid_100187712/obstacle_anchor_848eadab.png",
  coralWall: "https://cdn.enter.pro/resources/uid_100187712/obstacle_coral_wall_b98fd8d8.png",
  shark: "https://cdn.enter.pro/resources/uid_100187712/obstacle_shark_b2a2695d.png",
  jellyfish: "https://cdn.enter.pro/resources/uid_100187712/obstacle_jellyfish_3b0a164a.png",
  shipwreck: "https://cdn.enter.pro/resources/uid_100187712/obstacle_shipwreck_80f01720.png",
  airTank: "https://cdn.enter.pro/resources/uid_100187712/item_oxygen_tank_9b167cc3.png",
  rainbowClam: "https://cdn.enter.pro/resources/uid_100187712/item_rainbow_clam_aca7ddfd.png",
  fish: "https://cdn.enter.pro/resources/uid_100187712/obstacle_fish_7b524f31.png",
} as const;

export type SpriteKey = keyof typeof SPRITES;
