<script lang="ts">
  import { DESAGA_ADDRESS, DESAGA_MAPS_URL } from '$lib/location';

  export let address = DESAGA_ADDRESS;
  export let href = DESAGA_MAPS_URL;
  export let compact = false;
</script>

<a
  class="map-preview"
  class:compact
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`Deschide harta pentru ${address}`}
>
  <span class="park park-north"></span>
  <span class="park park-east"></span>
  <span class="hatched lot lot-central"></span>
  <span class="hatched lot lot-south"></span>
  <span class="hatched lot lot-east"></span>

  <span class="road road-main"></span>
  <span class="road road-albini"></span>
  <span class="road road-horticultorilor"></span>
  <span class="road road-buza"></span>
  <span class="road road-west-loop"></span>
  <span class="road road-east-loop"></span>
  <span class="road road-south-east"></span>
  <span class="road road-small road-small-a"></span>
  <span class="road road-small road-small-b"></span>
  <span class="road road-small road-small-c"></span>
  <span class="road road-small road-small-d"></span>
  <span class="road road-small road-small-e"></span>

  <span class="street-label label-main">Strada Constantin Brâncuși</span>
  <span class="street-label label-albini">Str. Septimiu Albini</span>
  <span class="street-label label-horticultorilor">Strada Horticultorilor</span>
  <span class="street-label label-buza">Strada Ioan Budai Deleanu</span>
  <span class="street-label label-milcov">Strada Milcovului</span>

  <span class="route route-main-a">103G</span>
  <span class="route route-main-b">103G</span>
  <span class="route route-main-c">103G</span>

  <span class="poi poi-synevo"><i></i><span>Synevo Brancusi<br />Cluj-Napoca</span></span>
  <span class="poi poi-school"><i></i><span>Scoala Gimnaziala<br />Constantin Brancusi</span></span>
  <span class="poi poi-digi"><i></i><span>Digi</span></span>
  <span class="poi poi-mega"><i></i><span>Mega Image</span></span>
  <span class="poi poi-carrefour"><i></i><span>Carrefour</span></span>
  <span class="poi poi-bank"><i></i><span>Banca Transilvania</span></span>
  <span class="poi poi-lumen"><i></i><span>Lumen Events Bar</span></span>
  <span class="poi poi-bloc"><i></i><span>Bloc</span></span>
  <span class="poi poi-dental"><i></i><span>Iancudent</span></span>

  <span class="parking parking-a">P</span>
  <span class="parking parking-b">P</span>
  <span class="parking parking-c">P</span>

  <span class="desaga-marker">
    <span class="pin"></span>
    <span class="desaga-label">DeSaga Cu Legume</span>
  </span>
</a>

<style>
  .map-preview {
    position: relative;
    display: block;
    width: 100%;
    min-height: 420px;
    overflow: hidden;
    isolation: isolate;
    color: #3f5d6c;
    text-decoration: none;
    background:
      radial-gradient(circle at 25% 18%, rgba(204, 237, 221, 0.36), transparent 14rem),
      linear-gradient(180deg, #fbfbfa 0%, #f8faf8 100%);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: var(--desaga-radius-lg, 20px);
    box-shadow: none;
    cursor: pointer;
  }

  .map-preview:hover,
  .map-preview:focus {
    color: #3f5d6c;
    text-decoration: none;
  }

  .map-preview:focus-visible {
    outline: 0;
    box-shadow:
      var(--desaga-focus-ring, 0 0 0 0.22rem rgba(181, 42, 47, 0.24)),
      0 10px 26px rgba(15, 23, 42, 0.07);
  }

  .map-preview::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      linear-gradient(90deg, rgba(214, 224, 229, 0.28) 1px, transparent 1px),
      linear-gradient(180deg, rgba(214, 224, 229, 0.22) 1px, transparent 1px);
    background-size: 86px 86px;
  }

  .map-preview::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 20;
    pointer-events: none;
    box-shadow: inset 0 0 0 999px rgba(255, 255, 255, 0.02);
  }

  .park,
  .hatched,
  .road,
  .street-label,
  .route,
  .poi,
  .parking,
  .desaga-marker {
    position: absolute;
  }

  .park {
    z-index: 0;
    background: rgba(162, 226, 187, 0.48);
  }

  .park-north {
    left: 35%;
    top: -28%;
    width: 22%;
    height: 45%;
    border-radius: 0 0 56% 42%;
    transform: rotate(12deg);
  }

  .park-east {
    right: 17%;
    bottom: 21%;
    width: 12%;
    height: 11%;
    border-radius: 8px;
    transform: rotate(-8deg);
  }

  .hatched {
    z-index: 0;
    border-radius: 8px;
    opacity: 0.72;
    background:
      repeating-linear-gradient(
        -45deg,
        rgba(203, 211, 216, 0.32) 0,
        rgba(203, 211, 216, 0.32) 2px,
        transparent 2px,
        transparent 8px
      );
  }

  .lot-central {
    left: 47%;
    top: 40%;
    width: 19%;
    height: 15%;
    transform: rotate(-2deg);
  }

  .lot-south {
    left: 28%;
    bottom: 2%;
    width: 19%;
    height: 14%;
    transform: rotate(-24deg);
  }

  .lot-east {
    right: 7%;
    bottom: 20%;
    width: 19%;
    height: 11%;
    transform: rotate(7deg);
  }

  .road {
    z-index: 3;
    border-radius: var(--radius-sm);
    background: #c4d2df;
    box-shadow:
      inset 0 0 0 1px rgba(107, 126, 145, 0.12),
      0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .road-main {
    left: 2%;
    top: 31%;
    width: 101%;
    height: 42px;
    transform: rotate(44deg);
    transform-origin: 46% 50%;
  }

  .road-albini {
    left: 26%;
    top: -12%;
    width: 42px;
    height: 68%;
    transform: rotate(-13deg);
  }

  .road-horticultorilor {
    right: -7%;
    top: 38%;
    width: 54%;
    height: 34px;
    transform: rotate(2deg);
  }

  .road-buza {
    left: -3%;
    bottom: -8%;
    width: 38%;
    height: 30px;
    transform: rotate(47deg);
  }

  .road-west-loop {
    left: 4%;
    top: 42%;
    width: 20%;
    height: 94px;
    border-radius: var(--radius);
    transform: rotate(37deg);
    background:
      linear-gradient(#c4d2df, #c4d2df) left 0 top 0 / 100% 28px no-repeat,
      linear-gradient(#c4d2df, #c4d2df) left 0 bottom 0 / 100% 28px no-repeat,
      linear-gradient(#c4d2df, #c4d2df) left 0 top 0 / 28px 100% no-repeat;
  }

  .road-east-loop {
    right: 23%;
    top: 25%;
    width: 20%;
    height: 38%;
    border-radius: var(--radius-lg);
    background:
      linear-gradient(#c4d2df, #c4d2df) left 0 top 0 / 100% 28px no-repeat,
      linear-gradient(#c4d2df, #c4d2df) right 0 top 0 / 28px 100% no-repeat,
      linear-gradient(#c4d2df, #c4d2df) left 62% bottom 0 / 46% 28px no-repeat;
  }

  .road-south-east {
    right: 7%;
    bottom: 12%;
    width: 24%;
    height: 30px;
    transform: rotate(47deg);
  }

  .road-small {
    z-index: 2;
    height: 12px;
    background: #d5e0e8;
  }

  .road-small-a {
    left: 18%;
    top: 29%;
    width: 24%;
    transform: rotate(-39deg);
  }

  .road-small-b {
    left: 34%;
    bottom: 14%;
    width: 24%;
    transform: rotate(44deg);
  }

  .road-small-c {
    right: 7%;
    top: 58%;
    width: 19%;
    transform: rotate(-44deg);
  }

  .road-small-d {
    right: -2%;
    top: 51%;
    width: 18%;
    transform: rotate(32deg);
  }

  .road-small-e {
    left: 47%;
    top: 28%;
    width: 13%;
    transform: rotate(84deg);
  }

  .street-label {
    z-index: 9;
    max-width: 260px;
    color: #f7fbff;
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1;
    text-shadow:
      0 1px 1px rgba(49, 72, 89, 0.85),
      0 -1px 1px rgba(49, 72, 89, 0.72),
      1px 0 1px rgba(49, 72, 89, 0.72),
      -1px 0 1px rgba(49, 72, 89, 0.72);
    white-space: nowrap;
  }

  .label-main {
    left: 55%;
    bottom: 22%;
    transform: rotate(-46deg);
  }

  .label-albini {
    left: 31%;
    top: 25%;
    transform: rotate(44deg);
  }

  .label-horticultorilor {
    right: 20%;
    top: 37%;
    transform: rotate(2deg);
  }

  .label-buza {
    left: 5%;
    bottom: 12%;
    transform: rotate(47deg);
  }

  .label-milcov {
    left: 24%;
    top: 1%;
    transform: rotate(82deg);
  }

  .route {
    z-index: 10;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 31px;
    height: 20px;
    padding: 0 4px;
    color: #ffffff;
    background: #2f66ad;
    border: 2px solid #ffffff;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 1px 2px rgba(24, 45, 65, 0.18);
  }

  .route-main-a {
    left: 20%;
    top: 30%;
  }

  .route-main-b {
    left: 48%;
    top: 56%;
  }

  .route-main-c {
    right: 18%;
    bottom: 7%;
  }

  .poi {
    z-index: 11;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #4b6b7b;
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.1;
    white-space: nowrap;
  }

  .poi i {
    width: 23px;
    height: 23px;
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    border: 3px solid #ffffff;
    border-radius: var(--radius-lg);
    background: #6f8f9b;
    box-shadow: 0 1px 4px rgba(24, 45, 65, 0.25);
  }

  .poi i::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: var(--radius-lg);
    background: #ffffff;
  }

  .poi-carrefour,
  .poi-mega {
    color: #0b72e7;
  }

  .poi-carrefour i,
  .poi-mega i {
    background: #1397ff;
  }

  .poi-bank {
    color: #5366d5;
  }

  .poi-bank i {
    background: #6275e9;
  }

  .poi-dental {
    color: #e33943;
  }

  .poi-dental i {
    background: #f1505a;
  }

  .poi-synevo {
    left: 15%;
    top: 8%;
  }

  .poi-school {
    right: 26%;
    top: 18%;
  }

  .poi-digi {
    left: 35%;
    top: 48%;
  }

  .poi-mega {
    left: 4%;
    top: 24%;
  }

  .poi-carrefour {
    left: 27%;
    bottom: 29%;
  }

  .poi-bank {
    left: 43%;
    bottom: 23%;
  }

  .poi-lumen {
    left: 2%;
    bottom: 30%;
  }

  .poi-bloc {
    right: 23%;
    bottom: 25%;
  }

  .poi-dental {
    right: 5%;
    bottom: 14%;
  }

  .parking {
    z-index: 12;
    display: grid;
    width: 23px;
    height: 23px;
    place-items: center;
    color: #5567ff;
    background: #edf0ff;
    border: 2px solid #ffffff;
    border-radius: var(--radius-lg);
    font-size: 0.8rem;
    font-weight: 700;
    box-shadow: 0 1px 4px rgba(24, 45, 65, 0.18);
  }

  .parking-a {
    left: 50%;
    top: 44%;
  }

  .parking-b {
    left: 32%;
    bottom: 16%;
  }

  .parking-c {
    right: 14%;
    bottom: 29%;
  }

  .desaga-marker {
    z-index: 16;
    left: 45%;
    top: 51%;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #d60000;
    font-size: 0.86rem;
    font-weight: 500;
    white-space: nowrap;
    transform: translateY(-50%);
  }

  .pin {
    position: relative;
    width: 30px;
    height: 30px;
    display: inline-block;
    flex: 0 0 auto;
    border-radius: 999px 999px 999px 0;
    background: #e13a30;
    box-shadow:
      0 0 0 2px rgba(173, 32, 25, 0.12),
      0 4px 10px rgba(97, 21, 21, 0.28);
    transform: rotate(-45deg);
  }

  .pin::after {
    content: '';
    position: absolute;
    inset: 9px;
    border-radius: var(--radius-sm);
    background: #9f201b;
  }

  .desaga-label {
    padding: 2px 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.78);
  }

  .map-preview.compact {
    min-height: 180px;
    border-radius: var(--radius);
    box-shadow: none;
  }

  .map-preview.compact .street-label,
  .map-preview.compact .poi,
  .map-preview.compact .parking,
  .map-preview.compact .route-main-c,
  .map-preview.compact .road-small-d,
  .map-preview.compact .road-small-e {
    display: none;
  }

  .map-preview.compact .road-main {
    top: 29%;
    height: 32px;
  }

  .map-preview.compact .road-horticultorilor {
    top: 38%;
    height: 24px;
  }

  .map-preview.compact .road-albini {
    width: 30px;
  }

  .map-preview.compact .desaga-marker {
    left: 41%;
    top: 53%;
    font-size: 0.78rem;
  }

  .map-preview.compact .pin {
    width: 24px;
    height: 24px;
  }

  .map-preview.compact .pin::after {
    inset: 7px;
  }

  @media (max-width: 767.98px) {
    .map-preview {
      min-height: 300px;
      border-radius: var(--radius);
    }

    .poi-school,
    .poi-synevo,
    .poi-lumen,
    .poi-bloc,
    .poi-dental,
    .label-buza,
    .label-milcov,
    .route-main-c {
      display: none;
    }

    .street-label {
      font-size: 0.72rem;
    }

    .label-main {
      left: 50%;
      bottom: 20%;
    }

    .desaga-marker {
      left: 41%;
      top: 51%;
      font-size: 0.78rem;
    }

    .map-preview.compact {
      min-height: 170px;
    }
  }
</style>
