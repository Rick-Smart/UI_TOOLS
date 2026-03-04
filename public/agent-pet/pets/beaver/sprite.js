export const beaverSprite = {
  "name": "Beaver",
  "frameDuration": 6,
  "atlas": {
    "src": "/agent-pet/pets/beaver/media/sheet.png",
    "scale": 2,
    "facing": "right"
  },
  "shadow": {
    "groundOffset": 1,
    "groundWidthPad": 14,
    "airborneOffset": 14,
    "airborneWidthPad": 4,
    "airborneActions": []
  },
  "animations": {
    "ascent": {
      "title": "Ascent",
      "category": "movement",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 320,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Ascent",
          "actionKey": "ascent",
          "category": "movement"
        },
        {
          "x": 32,
          "y": 320,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Ascent",
          "actionKey": "ascent",
          "category": "movement"
        },
        {
          "x": 64,
          "y": 320,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Ascent",
          "actionKey": "ascent",
          "category": "movement"
        },
        {
          "x": 96,
          "y": 320,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Ascent",
          "actionKey": "ascent",
          "category": "movement"
        }
      ]
    },
    "bite": {
      "title": "Bite",
      "category": "interaction",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Bite",
          "actionKey": "bite",
          "category": "interaction"
        },
        {
          "x": 32,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Bite",
          "actionKey": "bite",
          "category": "interaction"
        },
        {
          "x": 64,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Bite",
          "actionKey": "bite",
          "category": "interaction"
        },
        {
          "x": 96,
          "y": 96,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Bite",
          "actionKey": "bite",
          "category": "interaction"
        }
      ]
    },
    "damage": {
      "title": "Damage",
      "category": "negative",
      "playable": false,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 128,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Damage",
          "actionKey": "damage",
          "category": "negative"
        },
        {
          "x": 32,
          "y": 128,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Damage",
          "actionKey": "damage",
          "category": "negative"
        },
        {
          "x": 64,
          "y": 128,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Damage",
          "actionKey": "damage",
          "category": "negative"
        },
        {
          "x": 96,
          "y": 128,
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
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        },
        {
          "x": 32,
          "y": 160,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Death",
          "actionKey": "death",
          "category": "negative"
        }
      ]
    },
    "dive": {
      "title": "Dive",
      "category": "movement",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 288,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Dive",
          "actionKey": "dive",
          "category": "movement"
        },
        {
          "x": 32,
          "y": 288,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Dive",
          "actionKey": "dive",
          "category": "movement"
        },
        {
          "x": 64,
          "y": 288,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Dive",
          "actionKey": "dive",
          "category": "movement"
        },
        {
          "x": 96,
          "y": 288,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Dive",
          "actionKey": "dive",
          "category": "movement"
        }
      ]
    },
    "idle": {
      "title": "Idle",
      "category": "idle",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
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
        }
      ]
    },
    "idle-water": {
      "title": "Idle Water",
      "category": "idle",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle Water",
          "actionKey": "idle-water",
          "category": "idle"
        },
        {
          "x": 32,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle Water",
          "actionKey": "idle-water",
          "category": "idle"
        },
        {
          "x": 64,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle Water",
          "actionKey": "idle-water",
          "category": "idle"
        },
        {
          "x": 96,
          "y": 192,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Idle Water",
          "actionKey": "idle-water",
          "category": "idle"
        }
      ]
    },
    "movement": {
      "title": "Movement",
      "category": "movement",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement",
          "actionKey": "movement",
          "category": "movement"
        },
        {
          "x": 32,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement",
          "actionKey": "movement",
          "category": "movement"
        },
        {
          "x": 64,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement",
          "actionKey": "movement",
          "category": "movement"
        },
        {
          "x": 96,
          "y": 32,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement",
          "actionKey": "movement",
          "category": "movement"
        }
      ]
    },
    "movement-water": {
      "title": "Movement Water",
      "category": "movement",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 224,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement Water",
          "actionKey": "movement-water",
          "category": "movement"
        },
        {
          "x": 32,
          "y": 224,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement Water",
          "actionKey": "movement-water",
          "category": "movement"
        },
        {
          "x": 64,
          "y": 224,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement Water",
          "actionKey": "movement-water",
          "category": "movement"
        },
        {
          "x": 96,
          "y": 224,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement Water",
          "actionKey": "movement-water",
          "category": "movement"
        }
      ]
    },
    "movement-water-with-stick": {
      "title": "Movement Water with Stick",
      "category": "movement",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 256,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement Water with Stick",
          "actionKey": "movement-water-with-stick",
          "category": "movement"
        },
        {
          "x": 32,
          "y": 256,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement Water with Stick",
          "actionKey": "movement-water-with-stick",
          "category": "movement"
        },
        {
          "x": 64,
          "y": 256,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement Water with Stick",
          "actionKey": "movement-water-with-stick",
          "category": "movement"
        },
        {
          "x": 96,
          "y": 256,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement Water with Stick",
          "actionKey": "movement-water-with-stick",
          "category": "movement"
        }
      ]
    },
    "movement-with-stick": {
      "title": "Movement with Stick",
      "category": "movement",
      "playable": true,
      "frameCount": 4,
      "totalTicks": 24,
      "averageTicks": 6,
      "frames": [
        {
          "x": 0,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement with Stick",
          "actionKey": "movement-with-stick",
          "category": "movement"
        },
        {
          "x": 32,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement with Stick",
          "actionKey": "movement-with-stick",
          "category": "movement"
        },
        {
          "x": 64,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement with Stick",
          "actionKey": "movement-with-stick",
          "category": "movement"
        },
        {
          "x": 96,
          "y": 64,
          "w": 32,
          "h": 32,
          "ticks": 6,
          "action": "Movement with Stick",
          "actionKey": "movement-with-stick",
          "category": "movement"
        }
      ]
    }
  },
  "animationOrder": [
    "ascent",
    "bite",
    "damage",
    "death",
    "dive",
    "idle",
    "idle-water",
    "movement",
    "movement-water",
    "movement-water-with-stick",
    "movement-with-stick"
  ],
  "defaultAnimationKeys": {
    "idle": "idle",
    "movement": "ascent",
    "interaction": "bite",
    "celebration": "ascent"
  },
  "frames": [
    {
      "x": 0,
      "y": 320,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Ascent",
      "actionKey": "ascent",
      "category": "movement"
    },
    {
      "x": 32,
      "y": 320,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Ascent",
      "actionKey": "ascent",
      "category": "movement"
    },
    {
      "x": 64,
      "y": 320,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Ascent",
      "actionKey": "ascent",
      "category": "movement"
    },
    {
      "x": 96,
      "y": 320,
      "w": 32,
      "h": 32,
      "ticks": 6,
      "action": "Ascent",
      "actionKey": "ascent",
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
    }
  ]
};
