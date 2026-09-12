#!/usr/bin/env bash
# Map each delivered clip to the site whose prompt produced it, then optimize
# and install it. --keep everywhere: the sources are deleted only after the
# implementation has been verified.
set -u
cd "$(dirname "$0")/.."

run() {
  slug="$1"; slot="$2"; file="$3"
  if [ ! -f "videos_new/$file" ]; then
    echo "MISSING_SOURCE: $slug <- $file"
    return
  fi
  echo "=== $slug  [$slot]"
  npm run optimize:video -- --slug "$slug" --slot "$slot" --input "videos_new/$file" --keep 2>&1 \
    | grep -E "^VIDEO_(OK|FAIL)|Source:|  -> |bitrate|meta\.video" | head -8
}

run tendonforge                       "masked type fill"     "Hydrojet_manifold_spraying_water…_20260911132843.mp4"
run the-cryo-biome-crypt              "hero background"      "Cryogenic_vault_with_liquid_nitr…_20260911133238.mp4"
run mash-and-manifold                 "marquee strip"        "Sourdough_dough_extruding_throug…_20260911133408.mp4"
run the-salt-barrow-malt-shieling     "hover reveal"         "Barley_steeping_in_tidal_barrow_20260911133721.mp4"
run magnaloom                         "grid tile"            "Wire_threading_through_ferrite_t…_20260911133936.mp4"
run pentland-acoustic-telemetry-works "sticky rail loop"     "Sonar_transducer_in_coastal_work…_20260911134112.mp4"
run lv-74-marine-apothecary           "hero inset frame"     "Pouring_balm_into_tin_containers_20260911134312.mp4"
run the-cryo-pelagic-cell             "modal feature"        "Cable_disturbing_cold_brine_tank_20260911134446.mp4"
run k-92-maritime-victualling         "split panel"          "Canisters_staged_on_wet_quay_20260911134808.mp4"
run the-fenland-yeast-guild           "footer ambient"       "Copper_vessel_capturing_wild_yeast_20260911134951.mp4"
run k-44-ordnance-canvas              "inline process demo"  "Industrial_sewing_machine_stitch…_20260911135117.mp4"
run codex-parallax                    "hover reveal"         "Illumination_revealing_palimpses…_20260911135222.mp4"
run litho-acoustic-labs               "hero background"      "Laser_beam_inside_limestone_cave_20260911140812.mp4"
run abyssal-crust-vaults              "masked type fill"     "Brine_pool_with_salt_crystals_20260911141136.mp4"
run cedar-and-salt                    "sticky rail loop"     "Cooper_driving_hoop_on_tub_20260911141319.mp4"
run lock-and-sluice                   "grid tile"            "Coal_forge_heating_iron_strap_20260911141520.mp4"
run mantlecut-geology                 "hero inset frame"     "Diamond-wire_cutting_granite_rock_20260911141748.mp4"
run sarek-bark-gear                   "footer ambient"       "Snow_falling_in_birch_forest_20260911142136.mp4"

echo "INSTALL_DONE"
