export const backgroundColorLUT = {
    // keys:       -1.4 (Night)   -1.2 (Twilight)   0 (Sunrise)   0.25 (Morning)   0.5 (Noon)   0.67 (Evening)   0.83 (Early Sunset)   1 (Sunset)   1.2 (Twilight)   1.4 (Night) 
    stops:               [-1.4, -1.2, 0, 0.25, 0.5, 0.67, 0.83, 1, 1.2, 1.4],

    // SKY
    sky1: /* radiance */        ["#121e49", "#212d67", "#f1cc90", "#f4b083", "#4ec9f4", "#d4effc", "#90666c", "#ffb642", "#212d67", "#121e49"],
    sky2:                       ["#010015", "#171f46", "#b79b8b", "#a0c4d4", "#a0c4d4", "#a0c4d4", "#6b789e", "#eec189", "#171f46", "#010015"],
    skyPosX:                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    skyPosY:                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

    // WATER
    waterRipple:                ["#2c334c", "#25376a", "#f3b49a", "#fadfb4", "#aee2ff", "#b7dff9", "#ce7b66", "#f2daaa", "#25376a", "#2c334c"],
    waterBackground2: /* bot */ ["#0d1023", "#152b50", "#ccab7a", "#a1bdca", "#9fdcef", "#a1bdca", "#758dad", "#ebb578", "#152b50", "#0d1023"],
    waterBackground1: /* top */ ["#13263e", "#0b1130", "#b09268", "#f4c29c", "#01a5d5", "#576f8e", "#c7715d", "#b66735", "#0b1130", "#13263e"],
    waterHills1:                ["#1f3856", "#1f3856", "#1f3856", "#1f3856", "#1f3856", "#1f3856", "#1f3856", "#0c0603", "#1f3856", "#1f3856"],
    waterHills2:                ["#50648700", "#50648700", "#50648700", "#50648700", "#50648700", "#50648700", "#50648700", "#c68b4900", "#50648700", "#50648700"],
    waterMountains1:            ["#50648700", "#50648700", "#50648700", "#50648700", "#50648700", "#50648700", "#50648700", "#c68b4900", "#50648700", "#50648700"],
    waterMountains2:            ["#1f3856", "#1f3856", "#1f3856", "#1f3856", "#1f3856", "#1f3856", "#1f3856", "#0c0603", "#1f3856", "#1f3856"],

    // MOUNTAINS BACK     
    mountainsBack1: /* bot */   ["#0d1023", "#0d1023", "#373333", "#3b5578", "#004d58", "#1f3856", "#2c3150", "#594c60", "#0d1023", "#0d1023"],
    mountainsBack2: /* top */   ["#13263e", "#13263e", "#4b3f38", "#4b5f7d", "#4b7ca6", "#506487", "#433954", "#634a56", "#13263e", "#13263e"],

    // MOUNTAINS FRONT
    mountainsFront1: /* bot */  ["#204363", "#204363", "#584a42", "#8a8ea9", "#7b93a7", "#7b93a7", "#5a4f6d", "#a57e79", "#204363", "#204363"],
    mountainsFront2: /* top */  ["#325176", "#325176", "#534b49", "#9789a0", "#a796be", "#617fa0", "#705367", "#bc836d", "#325176", "#325176"],

    // HILLS     
    hills1: /* bot */           ["#0d1023", "#0d1023", "#373333", "#1f3856", "#004d58", "#1f3856", "#1b203a", "#53475c", "#0d1023", "#0d1023"],
    hills2: /* top */           ["#13263e", "#13263e", "#4b3f38", "#506487", "#4b7ca6", "#506487", "#34304c", "#946763", "#13263e", "#13263e"],

    // STARS     
    stars:                      ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
    starsGlow:                  ["#ffffff", "#ffffff00", "#ffffff59", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff"],
    starsOpacity:               ["1", "0", "1", "0", "0", "0", "0", "0", "0", "1"],

    // SUN     
    sun1: /* core */            ["#f7e2ab", "#f7e2ab", "#f7e2ab", "#fefcb2", "#fefcb2", "#fefcb2", "#e8b788", "#f7e2ab", "#f7e2ab", "#f7e2ab"],
    sun2: /* outer */           ["#fefcf1", "#fefcf1", "#fefcf1", "#fdfab3", "#fdfab3", "#fdfab3", "#e8b788", "#fefcf1", "#fefcf1", "#fefcf1"],
    sunGlow:                    ["#ffffff00", "#ffffff00", "#ffffff", "#ffffff", "#ffffff", "#ffffff00", "#ffffff", "#ffffff", "#ffffff00", "#ffffff00"],
    sunOpacity:                 [0, 0, 1, 1, 1, 0, 1, 1, 0, 0],
    sunPosX:                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    sunPosY:                    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

    // MOON     
    moon:                       ["#fafcfb", "#fafcfb", "#fafcfb", "#fafcfb", "#fafcfb", "#fafcfb", "#fafcfb", "#fafcfb", "#fafcfb", "#fafcfb"],
    moonGlow:                   ["#ffffff", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff00", "#ffffff"],
    moonOpacity:                [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    moonPosX:                   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    moonPosY:                   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

    // CLOUDS     
    clouds1:                    ["#0d1023", "#171a36", "#f1cc90", "#f2bc9c", "#e1f3fd", "#e1f3fd", "#d46f59", "#e6b369", "#171a36", "#0d1023"],
    clouds2:                    ["#13263e", "#162646", "#f0dbc9", "#f8e3bf", "#fcfcfc", "#fcfcfc", "#e79675", "#e6b369", "#162646", "#13263e"],

    // TREES     
    treesTopLayer:              ["#0e1019", "#141924", "#0c0d09", "#1b3438", "#1f6946", "#172b36", "#18252c", "#2f3423", "#141924", "#0e1019"],
    treesBottomLayer:           ["#161827", "#191e2e", "#232015", "#244447", "#2c915b", "#1f3a4a", "#203037", "#404131", "#191e2e", "#161827"],
};     