export const backgroundColorLUT = {
    // keys:                       -1.4 (Night)  -1.2 (Twilight) -1.1 (post-Twilight) -0.1 (Pre-Sunrise) 0 (Sunrise)  0.25 (Morning)       0.5 (Noon)    0.83 (Evening) 0.915 (Early Sunset)  1 (Sunset) 1.2 (pre-Twilight) 1.2 (Twilight)      1.4 (Night) 
    stops:                      [         -1.4,            -1.2,            -1.1,            -0.1,               0,            0.25,             0.5,            0.67,           0.915,               1,             1.1,             1.2,             1.4],

    // SKY
    sky1: /* radiance */        ["#121e49ff",   "#212d67ff",   "#212d67ff",   "#212d67ff",   "#f1cc90ff",   "#f4b083ff",   "#4ec9f4ff",   "#d4effcff",   "#90666cff",   "#ffb642ff",   "#212d67ff",   "#212d67ff",   "#121e49ff"],
    sky2:                       ["#010015ff",   "#171f46ff",   "#171f46ff",   "#171f46ff",   "#b79b8bff",   "#a0c4d4ff",   "#a0c4d4ff",   "#a0c4d4ff",   "#6b789eff",   "#eec189ff",   "#171f46ff",   "#171f46ff",   "#010015ff"],
    skyPosX:                    [            0,            -345,            -345,            -345,            -345,               0,               0,             150,            -250,            -345,               0,               0,               0],
    skyPosY:                    [            0,             300,             300,             300,             365,               0,            -100,             -75,             100,             365,               0,               0,               0],

    // WATER
    waterRipple:                ["#2c334cff",   "#25376aff",   "#25376aff",   "#25376aff",   "#f3b49aff",   "#fadfb4ff",   "#aee2ffff",   "#b7dff9ff",   "#ce7b66ff",   "#f2daaaff",   "#25376aff",   "#25376aff",   "#2c334cff"],
    waterBackground2: /* bot */ ["#0d1023ff",   "#152b50ff",   "#152b50ff",   "#152b50ff",   "#ccab7aff",   "#a1bdcaff",   "#9fdcefff",   "#a1bdcaff",   "#758dadff",   "#ebb578ff",   "#152b50ff",   "#152b50ff",   "#0d1023ff"],
    waterBackground1: /* top */ ["#13263eff",   "#0b1130ff",   "#0b1130ff",   "#0b1130ff",   "#b09268ff",   "#f4c29cff",   "#01a5d5ff",   "#576f8eff",   "#c7715dff",   "#b66735ff",   "#0b1130ff",   "#0b1130ff",   "#13263eff"],
    waterHills1:                ["#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#0c0603ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff"],
    waterHills2:                ["#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#c68b4900",   "#50648700",   "#50648700",   "#50648700"],
    waterMountains1:            ["#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#50648700",   "#c68b4900",   "#50648700",   "#50648700",   "#50648700"],
    waterMountains2:            ["#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff",   "#0c0603ff",   "#1f3856ff",   "#1f3856ff",   "#1f3856ff"],

    // MOUNTAINS BACK     
    mountainsBack1: /* bot */   ["#0d1023ff",   "#0d1023ff",   "#0d1023ff",   "#0d1023ff",   "#373333ff",   "#3b5578ff",   "#004d58ff",   "#1f3856ff",   "#2c3150ff",   "#594c60ff",   "#0d1023ff",   "#0d1023ff",   "#0d1023ff"],
    mountainsBack2: /* top */   ["#13263eff",   "#13263eff",   "#13263eff",   "#13263eff",   "#4b3f38ff",   "#4b5f7dff",   "#4b7ca6ff",   "#506487ff",   "#433954ff",   "#634a56ff",   "#13263eff",   "#13263eff",   "#13263eff"],

    // MOUNTAINS FRONT
    mountainsFront1: /* bot */  ["#204363ff",   "#204363ff",   "#204363ff",   "#204363ff",   "#584a42ff",   "#8a8ea9ff",   "#7b93a7ff",   "#7b93a7ff",   "#5a4f6dff",   "#a57e79ff",   "#204363ff",   "#204363ff",   "#204363ff"],
    mountainsFront2: /* top */  ["#325176ff",   "#325176ff",   "#325176ff",   "#325176ff",   "#534b49ff",   "#9789a0ff",   "#a796beff",   "#617fa0ff",   "#705367ff",   "#bc836dff",   "#325176ff",   "#325176ff",   "#325176ff"],

    // HILLS     
    hills1: /* bot */           ["#0d1023ff",   "#0d1023ff",   "#0d1023ff",   "#0d1023ff",   "#373333ff",   "#1f3856ff",   "#004d58ff",   "#1f3856ff",   "#1b203aff",   "#53475cff",   "#0d1023ff",   "#0d1023ff",   "#0d1023ff"],
    hills2: /* top */           ["#13263eff",   "#13263eff",   "#13263eff",   "#13263eff",   "#4b3f38ff",   "#506487ff",   "#4b7ca6ff",   "#506487ff",   "#34304cff",   "#946763ff",   "#13263eff",   "#13263eff",   "#13263eff"],

    // STARS     
    stars:                      ["#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffffff"],
    starsGlow:                  ["#ffffffff",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff59",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffffff"],
    starsOpacity:               [            1,             0.7,             0.7,               0,               0,               0,               0,               0,               0,               0,             0.2,             0.2,               1],

    // SUN     
    sun1: /* core */            ["#f7e2abff",   "#f7e2abff",   "#f7e2abff",   "#f7e2abff",   "#f7e2abff",   "#fefcb2ff",   "#fefcb2ff",   "#fefcb2ff",   "#e8b788ff",   "#f7e2abff",   "#f7e2abff",   "#f7e2abff",   "#f7e2abff"],
    sun2: /* outer */           ["#fefcf1ff",   "#fefcf1ff",   "#fefcf1ff",   "#fefcf1ff",   "#fefcf1ff",   "#fdfab3ff",   "#fdfab3ff",   "#fdfab3ff",   "#e8b788ff",   "#fefcf1ff",   "#fefcf1ff",   "#fefcf1ff",   "#fefcf1ff"],
    sunGlow:                    ["#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffffff",   "#ffffffff",   "#ffffffff",   "#ffffff00",   "#ffffffff",   "#ffffffff",   "#ffffff00",   "#ffffff00",   "#ffffff00"],
    sunOpacity:                 [            0,               0,               0,               1,               1,               1,               1,               1,               1,               1,               0,               0,               0],
    sunPosX:                    [            0,            -345,            -345,            -345,            -345,            -125,              50,             300,            -250,            -345,            -345,            -345,               0],
    sunPosY:                    [            0,             700,             700,             500,             365,              40,            -100,            -225,             100,             365,             500,             500,               0],

    // MOON     
    moon:                       ["#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff",   "#fafcfbff"],
    moonGlow:                   ["#ffffffff",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffff00",   "#ffffffff"],
    moonOpacity:                [            1,               1,               0,               0,               0,               0,               0,               0,               0,               0,               1,               1,               1],
    moonPosX:                   [            0,             300,             300,               0,               0,               0,               0,               0,               0,             300,             300,               0,               0],
    moonPosY:                   [            0,            -150,            -150,               0,               0,               0,               0,               0,               0,            -150,            -150,               0,               0],

    // CLOUDS     
    clouds1:                    ["#0d1023ff",   "#171a36ff",   "#171a36ff",   "#171a36ff",   "#f1cc90ff",   "#f2bc9cff",   "#e1f3fdff",   "#e1f3fdff",   "#d46f59ff",   "#e6b369ff",   "#171a36ff",   "#171a36ff",   "#0d1023ff"],
    clouds2:                    ["#13263eff",   "#162646ff",   "#162646ff",   "#162646ff",   "#f0dbc9ff",   "#f8e3bfff",   "#fcfcfcff",   "#fcfcfcff",   "#e79675ff",   "#e6b369ff",   "#162646ff",   "#162646ff",   "#13263eff"],

    // TREES     
    treesTopLayer:              ["#0e1019ff",   "#141924ff",   "#141924ff",   "#141924ff",   "#0c0d09ff",   "#1b3438ff",   "#1f6946ff",   "#172b36ff",   "#18252cff",   "#2f3423ff",   "#141924ff",   "#141924ff",   "#0e1019ff"],
    treesBottomLayer:           ["#161827ff",   "#191e2eff",   "#191e2eff",   "#191e2eff",   "#232015ff",   "#244447ff",   "#2c915bff",   "#1f3a4aff",   "#203037ff",   "#404131ff",   "#191e2eff",   "#191e2eff",   "#161827ff"],
};     