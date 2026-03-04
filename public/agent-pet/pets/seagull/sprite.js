export const seagullSprite = {
  "name": "Seagull",
  "frameDuration": 6,
  "atlas": {
    "src": "/agent-pet/pets/seagull/media/sheet.png",
    "scale": 2,
    "facing": "right"
  },
  "shadow": {
    "groundOffset": 1,
    "groundWidthPad": 14,
    "airborneOffset": 14,
    "airborneWidthPad": 4,
    "airborneActions": [
      "Flight",
      "Flap",
      "Glide",
      "Glide 2"
    ]
  },
  "animations": {
    "damage": {
      "title": "Damage",
      "category": "negative",
      "playable": false,
      "frameCount": 2,
      "totalTicks": 12,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 160,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Damage",
          "actionKey": "damage",
          "category": "negative"
        },
        {
          "x": 224,
          "y": 160,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Damage",
          "actionKey": "damage",
          "category": "negative"
        }
      ]
    },
    "death": {
      "title": "Death",
      "category": "negative",
      "playable": false,
      "frameCount": 8,
      "totalTicks": 48,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        },
        {
          "x": 32,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        },
        {
          "x": 64,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        },
        {
          "x": 96,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        },
        {
          "x": 128,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        },
        {
          "x": 160,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        },
        {
          "x": 192,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        },
        {
          "x": 224,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        }
      ]
    },
    "flap": {
      "title": "Flap",
      "category": "movement",
      "playable": true,
      "frameCount": 2,
      "totalTicks": 12,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Flap",
          "actionKey": "flap",
          "category": "movement"
        },
        {
          "x": 224,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Flap",
          "actionKey": "flap",
          "category": "movement"
        }
      ]
    },
    "glide": {
      "title": "Glide",
      "category": "movement",
      "playable": true,
      "frameCount": 2,
      "totalTicks": 12,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Glide",
          "actionKey": "glide",
          "category": "movement"
        },
        {
          "x": 224,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Glide",
          "actionKey": "glide",
          "category": "movement"
        }
      ]
    },
    "glide-2": {
      "title": "Glide 2",
      "category": "movement",
      "playable": true,
      "frameCount": 2,
      "totalTicks": 12,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 128,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Glide 2",
          "actionKey": "glide-2",
          "category": "movement"
        },
        {
          "x": 224,
          "y": 128,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Glide 2",
          "actionKey": "glide-2",
          "category": "movement"
        }
      ]
    },
    "idle": {
      "title": "Idle",
      "category": "idle",
      "playable": true,
      "frameCount": 8,
      "totalTicks": 48,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 32,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 64,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 96,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 128,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 160,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 192,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        },
        {
          "x": 224,
          "y": 0,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle",
          "actionKey": "idle",
          "category": "idle"
        }
      ]
    },
    "idle-2": {
      "title": "Idle 2",
      "category": "idle",
      "playable": true,
      "frameCount": 2,
      "totalTicks": 12,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle 2",
          "actionKey": "idle-2",
          "category": "idle"
        },
        {
          "x": 224,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle 2",
          "actionKey": "idle-2",
          "category": "idle"
        }
      ]
    }
  },
  "animationOrder": [
    "damage",
    "death",
    "flap",
    "glide",
    "glide-2",
    "idle",
    "idle-2"
  ],
  "defaultAnimationKeys": {
    "idle": "idle",
    "movement": "flap",
    "interaction": "flap",
    "celebration": "flap"
  },
  "frames": [
    {
      "x": 0,
      "y": 64,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Flap",
      "actionKey": "flap",
      "category": "movement"
    },
    {
      "x": 224,
      "y": 64,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Flap",
      "actionKey": "flap",
      "category": "movement"
    },
    {
      "x": 0,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 32,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 64,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 96,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 128,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 160,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 192,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    },
    {
      "x": 224,
      "y": 0,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Idle",
      "actionKey": "idle",
      "category": "idle"
    }
  ]
};
