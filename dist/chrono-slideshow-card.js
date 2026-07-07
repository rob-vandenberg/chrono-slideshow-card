import{LitElement,html,css}from"https://unpkg.com/lit@2.0.0/index.js?module";import{live}from"https://unpkg.com/lit@2.0.0/directives/live.js?module";import{styleMap}from"https://unpkg.com/lit@2.0.0/directives/style-map.js?module";import{unsafeHTML}from"https://unpkg.com/lit@2.0.0/directives/unsafe-html.js?module";import{repeat}from"https://unpkg.com/lit@2.0.0/directives/repeat.js?module";import jsyaml from"https://cdn.jsdelivr.net/npm/js-yaml@4/+esm";const CARD_VERSION="1.1.50",mdiDragHorizontalVariant="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z";console.info("%c CHRONO-%cSLIDESHOW%c-CARD %c v1.1.50 ","background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 0 2px 4px; border-radius: 3px 0 0 3px;","background-color: #101010; color: #4676d3; font-weight: bold; padding: 2px 0;","background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 4px 2px 0;","background-color: #1E1E1E; color: #FFFFFF; font-weight: bold; padding: 2px 4px; border-radius: 0 3px 3px 0;");const DEFAULT_ITEM={_id:"",show:!0,horizontal:"center",vertical:"middle",icon:"",show_state:!1,font_color:"#FFFFFF",font_size:1,font_weight:400,line_height:"",border_radius:"",background_color:"",padding_horizontal:"",padding_vertical:"",margin_top:"",margin_bottom:"",text_shadow_color:"",text_shadow_blur:"",text_shadow_offset_x:"",text_shadow_offset_y:"",text_shadow_stroke_width:"",text_shadow_layers:2},DEFAULT_ENTITY_ITEM={...DEFAULT_ITEM,entity:""},DEFAULT_TEMPLATE_ITEM={...DEFAULT_ITEM,template:""},DEFAULT_ZONE_MODES={"top-left":"static","top-center":"static","top-right":"static","middle-left":"dynamic","middle-center":"dynamic","middle-right":"dynamic","bottom-left":"static","bottom-center":"static","bottom-right":"dynamic"},DEFAULT_ZONE_ALIGNMENT={"top-left":"left","top-center":"center","top-right":"right","middle-left":"left","middle-center":"center","middle-right":"right","bottom-left":"left","bottom-center":"center","bottom-right":"right"},DEFAULT_ZONE_OFFSET_X={"top-left":12,"top-center":0,"top-right":-12,"middle-left":12,"middle-center":0,"middle-right":-12,"bottom-left":12,"bottom-center":0,"bottom-right":-12},DEFAULT_ZONE_OFFSET_Y={"top-left":-12,"top-center":-12,"top-right":-12,"middle-left":0,"middle-center":0,"middle-right":0,"bottom-left":12,"bottom-center":12,"bottom-right":12},REFERENCE_HEIGHT_PX=400,EDITOR_PREVIEW_ASPECT_RATIO="16 / 10";function isInsideEditDialog(t){let e=t;for(;e;){if("HA-DIALOG"===e.tagName)return!0;e=e.parentElement||e.getRootNode()?.host}return!1}const HOLD_MS=500,DOUBLE_TAP_MS=250,SWIPE_THRESHOLD=40,DEFAULT_CONFIG={entity:"sensor.",sort_by:"filename",sort_reverse:!1,display_time:8,transition:"fade",transition_duration:.6,fit_mode:"contain",letterbox_color:"#000000",maxZoom:40,maxStretch:20,maxGap:0,zoomCenter:33,dimmer_enabled:!1,dimmer_entity:"",dimmer_lux_min:0,dimmer_lux_max:40,dimmer_min_opacity:0,dimmer_max_opacity:80,dimmer_color:"#000000",dimmer_aggressiveness:50,zone_modes:{...DEFAULT_ZONE_MODES},zone_alignment:{...DEFAULT_ZONE_ALIGNMENT},zone_offset_x:{...DEFAULT_ZONE_OFFSET_X},zone_offset_y:{...DEFAULT_ZONE_OFFSET_Y},items:[]},NUMERIC_ITEM_KEYS=new Set(["font_size","font_weight","line_height","border_radius","padding_horizontal","padding_vertical","margin_top","margin_bottom","text_shadow_blur","text_shadow_offset_x","text_shadow_offset_y","text_shadow_stroke_width"]),SHADOW_DEPENDENT_KEYS=new Set(["text_shadow_blur","text_shadow_offset_x","text_shadow_offset_y"]),UI_ITEM_KEYS=new Set(["_id","show","entity","template","horizontal","vertical","icon","show_state","font_color","font_size","font_weight","line_height","border_radius","background_color","padding_horizontal","padding_vertical","margin_top","margin_bottom","text_shadow_color","text_shadow_blur","text_shadow_offset_x","text_shadow_offset_y","text_shadow_stroke_width"]),UI_CARD_KEYS=new Set(["type","entity","sort_by","sort_reverse","display_time","transition","transition_duration","fit_mode","zone_modes","zone_alignment","items","hold_action","double_tap_action","swipe_up_action","swipe_down_action","dimmer_enabled","dimmer_entity","dimmer_lux_min","dimmer_lux_max","dimmer_min_opacity","dimmer_max_opacity","dimmer_aggressiveness"]),VERTICAL_OPTIONS=[{label:"Top",value:"top"},{label:"Middle",value:"middle"},{label:"Bottom",value:"bottom"}],HORIZONTAL_OPTIONS=[{label:"Left",value:"left"},{label:"Center",value:"center"},{label:"Right",value:"right"}],SORT_BY_OPTIONS=[{label:"Filename",value:"filename"},{label:"File date/time",value:"filedatetime"},{label:"Capture date/time",value:"exifdatetime"},{label:"Random",value:"random"}],TRANSITION_OPTIONS=[{label:"None",value:"none"},{label:"Fade",value:"fade"},{label:"Slide left",value:"slide-left"},{label:"Slide right",value:"slide-right"},{label:"Slide up",value:"slide-up"},{label:"Slide down",value:"slide-down"},{label:"Curtain",value:"curtain"},{label:"Clock",value:"clock"},{label:"Random",value:"random"}],RANDOM_TRANSITION_POOL=["fade","slide-left","slide-right","slide-up","slide-down","curtain","clock"];function pickRandomTransition(){return RANDOM_TRANSITION_POOL[Math.floor(Math.random()*RANDOM_TRANSITION_POOL.length)]}const FIT_MODE_OPTIONS=[{label:"Cover",value:"cover"},{label:"Contain",value:"contain"},{label:"Fill",value:"fill"},{label:"Intelligent",value:"intelligent"}],ZONE_MODE_OPTIONS=[{label:"Static",value:"static"},{label:"Dynamic",value:"dynamic"}],ZONE_ALIGNMENT_OPTIONS=[{label:"Left",value:"left"},{label:"Center",value:"center"},{label:"Right",value:"right"}],SHOW_ITEM_POSITION_BADGES=!1,VERTICAL_BADGE_COLORS={top:"#ac00ac",middle:"#c77c00",bottom:"#0600ff"},HORIZONTAL_BADGE_COLORS={left:"#bb9e00",center:"#10a800",right:"#00a896"},GROUP_DIVIDER_COLOR="#009ac7",_GROUP_DEFS=[{vertical:"top",horizontal:"left",label:"Top · Left"},{vertical:"top",horizontal:"center",label:"Top · Center"},{vertical:"top",horizontal:"right",label:"Top · Right"},{vertical:"middle",horizontal:"left",label:"Middle · Left"},{vertical:"middle",horizontal:"center",label:"Middle · Center"},{vertical:"middle",horizontal:"right",label:"Middle · Right"},{vertical:"bottom",horizontal:"left",label:"Bottom · Left"},{vertical:"bottom",horizontal:"center",label:"Bottom · Center"},{vertical:"bottom",horizontal:"right",label:"Bottom · Right"}],_GROUP_ORDER=_GROUP_DEFS.map(t=>`${t.vertical}-${t.horizontal}`);function sortItems(t){const e=t=>`${t.vertical??"middle"}-${t.horizontal??"center"}`;return[...t].sort((t,i)=>_GROUP_ORDER.indexOf(e(t))-_GROUP_ORDER.indexOf(e(i)))}function generateId(t=[]){const e=new Set(t.map(t=>t._id));let i;do{i=Math.random().toString(16).slice(2,10)}while(e.has(i));return i}function chronoFolderEntities(t){return Object.entries(t?.entities??{}).filter(([,t])=>"chrono_folder"===t.platform).map(([e])=>({value:e,label:t?.states?.[e]?.attributes?.friendly_name??e}))}function computeIntelligentFit(t,e,i,o,n,s,r){const a=t=>Math.round(1e3*t)/1e3,l=()=>{const n=Math.min(i/t,o/e);return{renderWidth:t*n,renderHeight:e*n}};if(!(t&&e&&i&&o))return l();const d=t/e,c=i/o,h=Math.max(c/d,d/c);if(a(h)<=1)return l();const m=1+(n??0),_=1+(s??0),p=r??0;let u,g;const f=Math.sqrt(h);f<=_?(u=f,g=f):(g=_,u=Math.min(h/g,m));const b=u*g;if(a(Math.max(0,1-b/h))>p)return l();const v=Math.min(i/t,o/e);let x=t*v*u,y=e*v*u;return d<c?x*=g:d>c&&(y*=g),{renderWidth:x,renderHeight:y}}function migrateConfig(t){let e=!1;if(t.items?.some(t=>!t._id)){const i=[];for(const e of t.items)i.push(e._id?e:{...e,_id:generateId(t.items.concat(i))});t={...t,items:i},e=!0}const i=t.zone_modes??{};Object.keys(DEFAULT_ZONE_MODES).some(t=>!(t in i))&&(t={...t,zone_modes:{...DEFAULT_ZONE_MODES,...i}},e=!0);const o=t.zone_alignment??{};Object.keys(DEFAULT_ZONE_ALIGNMENT).some(t=>!(t in o))&&(t={...t,zone_alignment:{...DEFAULT_ZONE_ALIGNMENT,...o}},e=!0);const n=t.zone_offset_x??{};Object.keys(DEFAULT_ZONE_OFFSET_X).some(t=>!(t in n))&&(t={...t,zone_offset_x:{...DEFAULT_ZONE_OFFSET_X,...n}},e=!0);const s=t.zone_offset_y??{};return Object.keys(DEFAULT_ZONE_OFFSET_Y).some(t=>!(t in s))&&(t={...t,zone_offset_y:{...DEFAULT_ZONE_OFFSET_Y,...s}},e=!0),{config:t,migrated:e}}function serializeExtrasToYaml(t,e){const i={};for(const[o,n]of Object.entries(t))e.has(o)||(i[o]=n);if(!Object.keys(i).length)return"";try{return jsyaml.dump(i,{indent:2}).trimEnd()}catch(t){return""}}function parseYamlExtras(t){const e=(t??"").trim();if(!e)return{};try{const t=jsyaml.load(e);return t&&"object"==typeof t&&!Array.isArray(t)?t:null}catch(t){return null}}function fireEvent(t,e,i={},o={}){const n=new Event(e,{bubbles:o.bubbles??!0,cancelable:Boolean(o.cancelable),composed:o.composed??!0});return n.detail=i,t.dispatchEvent(n),n}function navigate(t,e={}){e.replace?history.replaceState(null,"",t):history.pushState(null,"",t),fireEvent(window,"location-changed",{replace:e.replace??!1})}function toggleEntity(t,e){e&&t.callService("homeassistant","toggle",{entity_id:e})}function handleAction(t,e,i,o){let n;switch("double_tap"===o&&i.double_tap_action?n=i.double_tap_action:"hold"===o&&i.hold_action?n=i.hold_action:"tap"===o&&i.tap_action?n=i.tap_action:"swipe_up"===o&&i.swipe_up_action?n=i.swipe_up_action:"swipe_down"===o&&i.swipe_down_action&&(n=i.swipe_down_action),n||(n={action:"none"}),n.action){case"none":default:break;case"more-info":fireEvent(t,"hass-more-info",{entityId:n.entity??i.entity});break;case"navigate":n.navigation_path&&navigate(n.navigation_path,{replace:n.navigation_replace});break;case"url":n.url_path&&window.open(n.url_path,"_blank");break;case"toggle":toggleEntity(e,i.entity);break;case"perform-action":case"call-service":{const t=n.perform_action??n.service;if(!t)break;const[i,o]=t.split(".",2);if(!i||!o)break;e.callService(i,o,n.data??n.service_data,n.target);break}case"fire-dom-event":fireEvent(t,"ll-custom",n)}}function csParseNumber(t){const e=String(t).replace(",",".");if("-"===e||"-0"===e||e.endsWith("."))return null;if(""===e)return"";const i=parseFloat(e);return isNaN(i)||String(i)!==e?null:i}const _TEMPLATE_EXPR_RE=/\{\{(.*?)\}\}/gs,_IDENTIFIER_RE=/[A-Za-z_][A-Za-z0-9_]*/g;function _jinjaLiteral(t){if(null==t)return"''";const e=String(t);return""===e?"''":/^-?\d+(\.\d+)?$/.test(e)||"true"===e||"false"===e?e:`'${e.replace(/\\/g,"\\\\").replace(/'/g,"\\'")}'`}function substitutePhotoVariables(t,e){const i=String(t??"");if(!i.includes("{{")||!e)return{text:i,fullyLiteral:!i.includes("{{")};let o=!0;const n=[];i.replace(_TEMPLATE_EXPR_RE,(t,i)=>{const s=i.trim(),r=/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)&&Object.prototype.hasOwnProperty.call(e,s);return r||(o=!1),n.push({inner:i,isPhotoField:r,field:r?s:null}),t});let s=0;if(o){return{text:i.replace(_TEMPLATE_EXPR_RE,()=>{const{field:t}=n[s++],i=e[t];return null==i?"":String(i)}),fullyLiteral:!0}}return{text:i.replace(_TEMPLATE_EXPR_RE,(t,i)=>`{{${i.replace(_IDENTIFIER_RE,t=>Object.prototype.hasOwnProperty.call(e,t)?_jinjaLiteral(e[t]):t)}}}`),fullyLiteral:!1}}function csTextField(t,e,i,o={}){return html`
    <div class="text-field">
      <label>${unsafeHTML(t)}</label>
      <chrono-cs-textfield
        .value=${String(e??"")}
        type=${o.type??"text"}
        step=${o.step??""}
        min=${o.min??""}
        max=${o.max??""}
        @input=${i}
      ></chrono-cs-textfield>
    </div>
  `}function csToggleField(t,e,i,o="",n=!1){return html`
    <div class="toggle-field ${o}">
      ${n?html`<label class="toggle-field-spacer" aria-hidden="true">&nbsp;</label>`:""}
      <div class="toggle-field-row">
        <label>${unsafeHTML(t)}</label>
        <ha-switch .checked=${e} @change=${i}></ha-switch>
      </div>
    </div>
  `}function toSwatchHex(t){const e=String(t??"").trim();return/^#[0-9a-fA-F]{3}$/.test(e)||/^#[0-9a-fA-F]{6}$/.test(e)?e:/^#[0-9a-fA-F]{8}$/.test(e)?e.slice(0,7):"#000000"}function csColorPicker(t,e,i){const o=toSwatchHex(e);return html`
    <div class="text-field">
      <label>${unsafeHTML(t)}</label>
      <div class="color-picker-row">
        <input type="color" .value=${o} @input=${i}>
        <chrono-cs-textfield
          .value=${String(e??"")}
          @input=${i}
        ></chrono-cs-textfield>
      </div>
    </div>
  `}function csSelectField(t,e,i,o){return html`
    <div class="text-field">
      ${t?html`<label>${unsafeHTML(t)}</label>`:""}
      <chrono-cs-select
        .value=${e??""}
        .options=${i}
        @change=${o}
      ></chrono-cs-select>
    </div>
  `}function csButtonPicker(t,e,i,o,n="",s=""){return html`
    <div class="button-picker-field ${s}" style=${"end"===n?"justify-self:end":""}>
      <label>${unsafeHTML(t)}</label>
      <chrono-cs-button-toggle-group
        .value=${e}
        .options=${i}
        @change=${o}
      ></chrono-cs-button-toggle-group>
    </div>
  `}class CsTextfield extends LitElement{static properties={value:{type:String},type:{type:String},step:{type:String},min:{type:String},max:{type:String},placeholder:{type:String}};static styles=css`
    :host {
      display: block;
      width: 100%;
    }
    input {
      display: block;
      width: 100%;
      box-sizing: border-box;
      height: 56px;
      padding: 0 12px;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      color: var(--primary-text-color);
      font-size: 16px;
      font-family: inherit;
      outline: none;
      transition: border-bottom-color 0.2s;
    }
    input:focus {
      border-bottom: 2px solid var(--primary-color);
    }
  `;focus(){this.shadowRoot?.querySelector("input")?.focus()}render(){return html`
      <input
        part="input"
        .value=${live(this.value??"")}
        type=${this.type??"text"}
        step=${this.step??""}
        min=${this.min??""}
        max=${this.max??""}
        placeholder=${this.placeholder??""}
        @input=${t=>{this.value=t.target.value,this.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))}}
      >
    `}}customElements.define("chrono-cs-textfield",CsTextfield);class CsTextarea extends LitElement{static properties={value:{type:String},placeholder:{type:String},error:{type:Boolean}};static styles=css`
    :host {
      display: block;
      width: 100%;
    }
    textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      min-height: calc(3 * 1.5em + 24px);
      max-height: calc(20 * 1.5em + 24px);
      padding: 12px;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      color: var(--primary-text-color);
      font-size: 13px;
      font-family: monospace;
      outline: none;
      overflow-y: auto;
      resize: vertical;
      white-space: pre-wrap;
      word-wrap: break-word;
      transition: border-bottom-color 0.2s;
    }
    textarea:focus {
      border-bottom: 2px solid var(--primary-color);
    }
    textarea.error {
      border-bottom: 2px solid var(--error-color, #f44336);
    }
  `;focus(){this.shadowRoot?.querySelector("textarea")?.focus()}render(){return html`
      <textarea
        class="${this.error?"error":""}"
        .value=${live(this.value??"")}
        placeholder=${this.placeholder??""}
        @input=${t=>{this.value=t.target.value,this.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))}}
      ></textarea>
    `}}customElements.define("chrono-cs-textarea",CsTextarea);class CsButtonToggleGroup extends LitElement{static properties={value:{type:String},options:{type:Array}};static styles=css`
    :host {
      display: inline-flex;
    }
    button {
      min-width: 70px;
      height: 32px;
      margin-top: 6px;
      margin-bottom: 6px;
      padding: 0 12px;
      border: none;
      border-left: 1px solid var(--ha-color-border-neutral-quiet, #444);
      cursor: pointer;
      font-size: 14px;
      font-family: inherit;
      color: var(--primary-text-color);
      background: var(--ha-color-fill-primary-normal-resting, #002e3e);
      transition: background 0.15s;
    }
    button:first-child {
      border-left: none;
      border-radius: 9999px 0 0 9999px;
    }
    button:last-child {
      border-radius: 0 9999px 9999px 0;
    }
    button.only {
      border-radius: 9999px;
    }
    button.active {
      background: var(--ha-color-fill-primary-loud-resting, #009ac7);
    }
    button:not(.active):hover {
      background: var(--ha-color-fill-primary-quiet-hover, #004156);
    }
  `;render(){const t=this.options??[];return html`${t.map((e,i)=>{const o=1===t.length,n=0===i,s=i===t.length-1,r=[e.value===this.value?"active":"",o?"only":n?"first":s?"last":""].filter(Boolean).join(" ");return html`
        <button class="${r}" @click=${()=>this._select(e.value)}>${e.label}</button>
      `})}`}_select(t){this.value=t,this.dispatchEvent(new CustomEvent("change",{detail:{value:t},bubbles:!0,composed:!0}))}focus(){this.shadowRoot?.querySelector("button")?.focus()}}customElements.define("chrono-cs-button-toggle-group",CsButtonToggleGroup);class CsSelect extends LitElement{static properties={value:{type:String},options:{type:Array},_open:{state:!0},_cursor:{state:!0}};static styles=css`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      position: relative;
    }
    .combobox {
      display: flex;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
      height: 56px;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      transition: border-bottom-color 0.2s;
    }
    .combobox:focus-within,
    .combobox-open {
      border-bottom: 2px solid var(--primary-color);
    }
    .combobox-input {
      flex: 1;
      height: 100%;
      padding: 0 8px 0 12px;
      background: transparent;
      border: none;
      color: var(--primary-text-color);
      font-size: 16px;
      font-family: inherit;
      outline: none;
      min-width: 0;
      box-sizing: border-box;
    }
    .combobox-chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 100%;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 12px;
      flex-shrink: 0;
      user-select: none;
    }
    .combobox-chevron:hover {
      color: var(--primary-text-color);
    }
    .combobox-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 9999;
      background: var(--card-background-color, #1c1c1c);
      border: 1px solid var(--divider-color, #444);
      border-radius: 0 0 4px 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      max-height: 240px;
      overflow-y: auto;
      margin-top: 1px;
    }
    .combobox-option {
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      color: var(--primary-text-color);
      cursor: pointer;
      transition: background 0.1s;
    }
    .combobox-option:hover {
      background: var(--secondary-background-color, rgba(255,255,255,0.08));
    }
    .combobox-option-selected {
      color: var(--primary-color);
    }
    .combobox-option-cursor {
      background: var(--secondary-background-color, rgba(255,255,255,0.08));
    }
  `;constructor(){super(),this.value="",this.options=[],this._open=!1,this._cursor=-1,this._onOutsideClick=this._onOutsideClick.bind(this)}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onOutsideClick)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onOutsideClick)}_onOutsideClick(t){this.shadowRoot.contains(t.composedPath()[0])||t.composedPath()[0]===this||(this._open=!1,this._cursor=-1)}_select(t){this.value=t,this._open=!1,this._cursor=-1,this.dispatchEvent(new CustomEvent("change",{detail:{value:t},bubbles:!0,composed:!0}))}_handleKeyDown(t){const e=this.options??[];this._open?"ArrowDown"===t.key?(this._cursor=Math.min(this._cursor+1,e.length-1),t.preventDefault()):"ArrowUp"===t.key?(this._cursor=Math.max(this._cursor-1,0),t.preventDefault()):"Enter"===t.key?(this._cursor>=0&&this._cursor<e.length&&this._select(e[this._cursor].value),t.preventDefault()):"Escape"===t.key&&(this._open=!1,this._cursor=-1,t.preventDefault()):"ArrowDown"!==t.key&&"ArrowUp"!==t.key||(this._open=!0,this._cursor=0,t.preventDefault())}render(){const t=this.options??[];return html`
      <div part="combobox" class="combobox ${this._open?"combobox-open":""}">
        <input
          class="combobox-input"
          .value=${live(this.value??"")}
          @input=${t=>{this.dispatchEvent(new CustomEvent("change",{detail:{value:t.target.value},bubbles:!0,composed:!0}))}}
          @blur=${()=>{this._open=!1,this._cursor=-1}}
          @keydown=${this._handleKeyDown}
        >
        <div
          class="combobox-chevron"
          @click=${()=>{this._open=!this._open,this._cursor=-1,this.shadowRoot.querySelector(".combobox-input").focus()}}
          aria-hidden="true"
        >${this._open?"▴":"▾"}</div>
      </div>
      ${this._open?html`
        <div class="combobox-dropdown">
          ${t.map((t,e)=>html`
            <div
              class="combobox-option
                     ${t.value===this.value?"combobox-option-selected":""}
                     ${e===this._cursor?"combobox-option-cursor":""}"
              @mousedown=${e=>{e.preventDefault(),this._select(t.value)}}
            >${t.label}</div>
          `)}
        </div>
      `:""}
    `}focus(){this.shadowRoot?.querySelector(".combobox-input")?.focus()}}customElements.define("chrono-cs-select",CsSelect);class ChronoSlideshowCardEditor extends LitElement{static properties={hass:{attribute:!1},_config:{state:!0},_expandedItemId:{state:!0},_removedItem:{state:!0}};setConfig(t){const{config:e,migrated:i}=migrateConfig(t);this._config=e,i&&this._fireConfig()}_fireConfig(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}_valueChanged(t,e){if(!this._config)return;this._clearUndo();const i=e.target.value??e.detail?.value;this._config={...this._config,[t]:i},this._fireConfig()}_numericValueChanged(t,e){if(!this._config)return;this._clearUndo();const i=csParseNumber(e.target.value??e.detail?.value);null!==i&&(this._config={...this._config,[t]:i},this._fireConfig())}_toggleChanged(t,e){if(!this._config)return;this._clearUndo();const i=e.target.checked;this._config={...this._config,[t]:i},this._fireConfig()}_zoneModeChanged(t,e){if(!this._config)return;this._clearUndo();const i=e.target.value??e.detail?.value,o={...this._config.zone_modes??DEFAULT_ZONE_MODES,[t]:i};this._config={...this._config,zone_modes:o},this._fireConfig()}_zoneAlignmentChanged(t,e){if(!this._config)return;this._clearUndo();const i=e.target.value??e.detail?.value,o={...this._config.zone_alignment??DEFAULT_ZONE_ALIGNMENT,[t]:i};this._config={...this._config,zone_alignment:o},this._fireConfig()}_zoneOffsetChanged(t,e,i){if(!this._config)return;this._clearUndo();const o=csParseNumber(i.target.value??i.detail?.value);if(null===o)return;const n="x"===t?"zone_offset_x":"zone_offset_y",s="x"===t?DEFAULT_ZONE_OFFSET_X:DEFAULT_ZONE_OFFSET_Y,r={...this._config[n]??s,[e]:o};this._config={...this._config,[n]:r},this._fireConfig()}_itemChanged(t,e,i){if(!this._config)return;this._clearUndo();const o=i.target.value??i.detail?.value;let n;if(NUMERIC_ITEM_KEYS.has(e)){const i=csParseNumber(o);if(null===i)return;n=i,""===n&&SHADOW_DEPENDENT_KEYS.has(e)&&this._config.items[t]?.text_shadow_color&&(n=0)}else n=o;let s=[...this._config.items??[]];const r=s[t]?.text_shadow_color;let a={...s[t],[e]:n};if("text_shadow_color"===e&&!r&&n)for(const t of SHADOW_DEPENDENT_KEYS)""===a[t]&&(a[t]=0);s[t]=a,"horizontal"!==e&&"vertical"!==e||(s=sortItems(s)),this._config={...this._config,items:s},this._fireConfig()}_itemYamlChanged(t,e){if(!this._config)return;this._clearUndo();const i=parseYamlExtras(e.target.value??e.detail?.value??"");if(null===i)return;const o=[...this._config.items??[]],n=o[t],s={};for(const[t,e]of Object.entries(n))UI_ITEM_KEYS.has(t)&&(s[t]=e);o[t]={...s,...i},this._config={...this._config,items:o},this._fireConfig()}_itemToggled(t,e,i){if(!this._config)return;this._clearUndo();const o=i.target.checked,n=[...this._config.items??[]];n[t]={...n[t],[e]:o},this._config={...this._config,items:n},this._fireConfig()}_addItem(t){const e=this._config.items??[];let i="";if("entity"===t){const t=this.hass?.states??{};i=Object.keys(t).find(t=>t.startsWith("light."))??Object.keys(t)[0]??""}else i="{{ now().strftime('%H:%M') }}";const o="entity"===t?{...DEFAULT_ENTITY_ITEM,_id:generateId(e),entity:i}:{...DEFAULT_TEMPLATE_ITEM,_id:generateId(e),template:i},n=sortItems([...e,o]);this._expandedItemId=o._id,this._removedItem=null,this._config={...this._config,items:n},this._fireConfig(),this.updateComplete.then(async()=>{const t=this.shadowRoot?.querySelector(`[data-item-id="${o._id}"]`);t&&(await t.updateComplete,t.scrollIntoView({behavior:"smooth",block:"nearest"}),t.querySelector("chrono-cs-textfield")?.focus())})}_removeItem(t){const e=[...this._config.items??[]];this._removedItem={item:e[t],index:t},this._config={...this._config,items:e.filter((e,i)=>i!==t)},this._fireConfig()}_undoRemove(){if(!this._removedItem)return;const{item:t,index:e}=this._removedItem,i=[...this._config.items??[]];i.splice(e,0,t),this._removedItem=null,this._config={...this._config,items:i},this._fireConfig()}_clearUndo(){this._removedItem&&(this._removedItem=null)}_buildRows(t){const e=[];let i=0;for(const o of _GROUP_DEFS)e.push({type:"divider",group:o,key:`divider-${o.vertical}-${o.horizontal}`}),t.forEach((t,n)=>{(t.vertical??"middle")===o.vertical&&(t.horizontal??"center")===o.horizontal&&(this._removedItem&&i===this._removedItem.index&&e.push({type:"undo",key:"undo-remove"}),e.push({type:"item",item:t,itemIndex:n,key:t._id}),i++)});return this._removedItem&&i===this._removedItem.index&&e.push({type:"undo",key:"undo-remove"}),e}_itemMoved(t){t.stopPropagation(),this._clearUndo();const{oldIndex:e,newIndex:i}=t.detail,o=[...this._config.items??[]],n=this._buildRows(o);if(!n[e]||"item"!==n[e].type)return;n.splice(i,0,n.splice(e,1)[0]);let s=_GROUP_DEFS[0];const r=[];for(const t of n)"divider"!==t.type?r.push({...t.item,vertical:s.vertical,horizontal:s.horizontal}):s=t.group;this._config={...this._config,items:r},this._fireConfig()}_verticalOptions=VERTICAL_OPTIONS;_horizontalOptions=HORIZONTAL_OPTIONS;_sortByOptions=SORT_BY_OPTIONS;_transitionOptions=TRANSITION_OPTIONS;_fitModeOptions=FIT_MODE_OPTIONS;_zoneModeOptions=ZONE_MODE_OPTIONS;_zoneAlignmentOptions=ZONE_ALIGNMENT_OPTIONS;_renderZoneModesPanel(){const t=this._config?.zone_modes??DEFAULT_ZONE_MODES,e=this._config?.zone_alignment??DEFAULT_ZONE_ALIGNMENT,i=this._config?.zone_offset_x??DEFAULT_ZONE_OFFSET_X,o=this._config?.zone_offset_y??DEFAULT_ZONE_OFFSET_Y;return html`
      <ha-expansion-panel header="Zones configuration" outlined .expanded=${!1}>
        <p class="zone-modes-hint">
          Static zones stay fixed on screen. Dynamic zones transition together
          with the photo. Alignment controls how multiple items stacked in the
          same zone align relative to each other — independent from which
          screen position the zone itself occupies. Margins shift the entire
          zone's contents, since a zone does not stretch to fill its 1/3 of
          the screen — it sits pinned to whichever edge its column/row
          dictates. Positive x moves right, negative x moves left; positive
          y moves up, negative y moves down — for every zone, regardless of
          which corner or edge it's in. All overlay items placed in a zone
          share that zone's settings.
        </p>
        ${["top","middle","bottom"].map(n=>{const s=_GROUP_DEFS.filter(t=>t.vertical===n);return html`
            <div class="zone-band">
              <div class="zone-band-grid">
                <div class="zone-band-name">${n}</div>
                ${s.map(t=>html`<div class="zone-band-colheader">${t.horizontal[0].toUpperCase()}${t.horizontal.slice(1)}</div>`)}

                <div class="zone-band-rowlabel">Transition</div>
                ${s.map(e=>{const i=`${e.vertical}-${e.horizontal}`;return csSelectField("",t[i]??"static",this._zoneModeOptions,t=>this._zoneModeChanged(i,t))})}

                <div class="zone-band-rowlabel">Alignment</div>
                ${s.map(t=>{const i=`${t.vertical}-${t.horizontal}`;return csSelectField("",e[i]??t.horizontal,this._zoneAlignmentOptions,t=>this._zoneAlignmentChanged(i,t))})}

                <div class="zone-band-rowlabel">Margins (x,y)</div>
                ${s.map(t=>{const e=`${t.vertical}-${t.horizontal}`;return html`
                    <div class="zone-offset-pair">
                      <chrono-cs-textfield
                        class="zone-offset-mini"
                        type="number" step="1"
                        .value=${String(i[e]??0)}
                        @input=${t=>this._zoneOffsetChanged("x",e,t)}
                      ></chrono-cs-textfield>
                      <chrono-cs-textfield
                        class="zone-offset-mini"
                        type="number" step="1"
                        .value=${String(o[e]??0)}
                        @input=${t=>this._zoneOffsetChanged("y",e,t)}
                      ></chrono-cs-textfield>
                    </div>
                  `})}
              </div>
            </div>
          `})}
      </ha-expansion-panel>
    `}_renderItemsPanel(){const t=this._config?.items??[],e=this._buildRows(t);return html`
      <ha-expansion-panel header="Items configuration" outlined>

        <ha-sortable handle-selector=".handle" @item-moved=${t=>this._itemMoved(t)}>
          <div class="items-list">
            ${repeat(e,t=>t.key,t=>{if("divider"===t.type)return html`
                  <div class="group-divider">
                    <span class="group-divider-label" style="color:${"#009ac7"}">${t.group.label}</span>
                    <div class="group-divider-line" style="background:${"#009ac7"}"></div>
                  </div>
                `;if("undo"===t.type)return html`
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${()=>this._undoRemove()}>
                      Undo remove
                    </button>
                  </div>
                `;const e=t.item,i=t.itemIndex,o="entity"in e,n=o?"Entity":"Template",s=o?"entity":"template",r=o?e.entity||`Entity ${i+1}`:e.template?e.template.length>30?e.template.slice(0,30)+"…":e.template:`Template ${i+1}`;serializeExtrasToYaml(e,UI_ITEM_KEYS);return html`
                <ha-expansion-panel
                  outlined
                  data-item-id="${e._id}"
                  .expanded=${this._expandedItemId===e._id}
                  @expanded-changed=${t=>{this._expandedItemId=t.detail.value?e._id:null}}
                >

                  <div slot="header" class="item-header-slot">
                    <div class="item-header-content${!1===e.show?" item-hidden":""}">
                      ${""}
                      <span class="item-type-badge ${s}">${n}</span>
                      <span>${r}</span>
                    </div>
                    <button
                      class="item-visibility-btn"
                      title="${!1===e.show?"Show item":"Hide item"}"
                      @click=${t=>{t.stopPropagation(),this._itemToggled(i,"show",{target:{checked:!1===e.show}})}}
                    >
                      <ha-icon .icon=${!1===e.show?"mdi:eye-off-outline":"mdi:eye-outline"}></ha-icon>
                    </button>
                  </div>

                  <div class="handle" slot="leading-icon">
                    <ha-svg-icon .path=${mdiDragHorizontalVariant}></ha-svg-icon>
                  </div>

                  <!-- Position: vertical (top/middle/bottom) and horizontal (left/center/right) -->
                  <div class="item-position-row">
                    ${csButtonPicker("",e.vertical??"middle",this._verticalOptions,t=>this._itemChanged(i,"vertical",t))}
                    ${csButtonPicker("",e.horizontal??"center",this._horizontalOptions,t=>this._itemChanged(i,"horizontal",t))}
                  </div>

                  <!-- Entity ID or Template string -->
                  <div class="item-content-row">
                    ${o?csTextField("Entity ID",e.entity??"",t=>this._itemChanged(i,"entity",t)):csTextField('Template\n<i>supports Jinja2, e.g. {{ exifModel }} or {{ states("sensor.temp") }}</i>',e.template??"",t=>this._itemChanged(i,"template",t))}
                  </div>

                  <!-- Entity-only: icon override -->
                  ${o?html`
                    <div class="item-content-row">
                      ${csTextField("Icon",e.icon??"",t=>this._itemChanged(i,"icon",t))}
                    </div>
                  `:""}

                  <!-- Entity-only: show state toggle -->
                  ${o?html`
                    <div class="item-toggles-row">
                      ${csToggleField("Show state",e.show_state??!1,t=>this._itemToggled(i,"show_state",t))}
                    </div>
                  `:""}

                  <!-- Typography: font color, size, weight, line height, border radius -->
                  <div class="item-typography">
                    ${csColorPicker("Font color",e.font_color??"",t=>this._itemChanged(i,"font_color",t))}
                    ${csTextField("Font size",e.font_size??"",t=>this._itemChanged(i,"font_size",t),{type:"number",step:"0.1",min:"0"})}
                    ${csTextField("Font weight",e.font_weight??"",t=>this._itemChanged(i,"font_weight",t),{type:"number",step:"100",min:"100",max:"900"})}
                    ${csTextField("Line height",e.line_height??"",t=>this._itemChanged(i,"line_height",t),{type:"number",step:"0.1",min:"0"})}
                    ${csTextField("Border radius",e.border_radius??"",t=>this._itemChanged(i,"border_radius",t),{type:"number",step:"1",min:"0"})}
                  </div>

                  <!-- Background color, padding (horizontal/vertical), margin (top/bottom) -->
                  <div class="item-bg-color-padding">
                    ${csColorPicker("Background color",e.background_color??"",t=>this._itemChanged(i,"background_color",t))}
                    ${csTextField("Vertical padding",e.padding_vertical??"",t=>this._itemChanged(i,"padding_vertical",t),{type:"number",step:"1",min:"0"})}
                    ${csTextField("Horizontal padding",e.padding_horizontal??"",t=>this._itemChanged(i,"padding_horizontal",t),{type:"number",step:"1",min:"0"})}
                    ${csTextField("Top margin",e.margin_top??"",t=>this._itemChanged(i,"margin_top",t),{type:"number",step:"1"})}
                    ${csTextField("Bottom margin",e.margin_bottom??"",t=>this._itemChanged(i,"margin_bottom",t),{type:"number",step:"1"})}
                  </div>

                  <!-- Text shadow / stroke: color, blur, x/y offset, stroke width -->
                  <div class="item-text-shadow">
                    ${csColorPicker("Shadow color",e.text_shadow_color??"",t=>this._itemChanged(i,"text_shadow_color",t))}
                    ${csTextField("Shadow blur",e.text_shadow_blur??"",t=>this._itemChanged(i,"text_shadow_blur",t),{type:"number",step:"1",min:"0"})}
                    ${csTextField("Shadow offset X",e.text_shadow_offset_x??"",t=>this._itemChanged(i,"text_shadow_offset_x",t),{type:"number",step:"1"})}
                    ${csTextField("Shadow offset Y",e.text_shadow_offset_y??"",t=>this._itemChanged(i,"text_shadow_offset_y",t),{type:"number",step:"1"})}
                    ${csTextField("Stroke width",e.text_shadow_stroke_width??"",t=>this._itemChanged(i,"text_shadow_stroke_width",t),{type:"number",step:"1",min:"0"})}
                  </div>

                  <!-- Remove button -->
                  <div class="remove-item-row">
                    <button class="remove-item-btn" @click=${()=>this._removeItem(i)}>
                      Remove item
                    </button>
                  </div>

                </ha-expansion-panel>
              `})}
          </div>
        </ha-sortable>

        <div class="add-item-row">
          <button class="add-item-btn" @click=${()=>this._addItem("entity")}>+ Add entity</button>
          <button class="add-item-btn" @click=${()=>this._addItem("template")}>+ Add template</button>
        </div>

      </ha-expansion-panel>
    `}static styles=css`

    ha-expansion-panel {
      margin-top: 8px;
    }

    /* ── Grid rows ─────────────────────────────────────────────────────────── */

    .card-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .card-row-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .card-row-1 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .slider-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .slider-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .slider-field input[type="range"] {
      width: 100%;
      accent-color: var(--primary-color);
    }

    .item-position-row {
      display: flex;
      flex-direction: row;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
      margin-top: 4px;
    }

    .item-content-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-toggles-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 24px;
      margin-bottom: 16px;
    }

    .item-typography {
      display: grid;
      grid-template-columns: 19fr 8fr 8fr 8fr 8fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-bg-color-padding {
      display: grid;
      grid-template-columns: 19fr 8fr 8fr 8fr 8fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    .item-text-shadow {
      display: grid;
      grid-template-columns: 19fr 8fr 8fr 8fr 8fr;
      gap: 8px;
      align-items: end;
      margin-bottom: 8px;
    }

    /* ── Zone modes grid ───────────────────────────────────────────────────── */

    .zone-modes-hint {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin: 4px 0 12px;
    }

    .zone-band {
      border-top: 1px solid var(--divider-color, #444);
      padding-top: 10px;
      margin-bottom: 20px;
    }
    .zone-band:last-child {
      margin-bottom: 8px;
    }

    .zone-band-name {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--secondary-text-color);
    }

    /* Row-label column (3fr) carries the band name on the header row and
       "Transition"/"Alignment" on the field rows below; the three zone
       columns (4fr each) are equal width. Shared grid-template-columns
       across all three rows, so every column lines up vertically regardless
       of field content. Fixed proportion rather than equal/auto sizing
       because auto was sizing the row-label column too tight for "BOTTOM"
       (uppercase + letter-spacing renders wider than its raw character
       count). 5fr was tried first and visually confirmed too wide; 3fr is
       the value actually verified to look right. */
    .zone-band-grid {
      display: grid;
      grid-template-columns: 3fr 4fr 4fr 4fr;
      column-gap: 8px;
      row-gap: 6px;
      align-items: center;
    }

    .zone-band-rowlabel {
      font-size: 12px;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }

    .zone-band-colheader {
      font-size: 12px;
      color: var(--secondary-text-color);
      text-align: center;
    }

    .zone-offset-pair {
      display: flex;
      gap: 4px;
    }

    .zone-offset-mini {
      width: 0; /* flex-basis via flex:1 below — width:0 avoids intrinsic-content overflow */
      flex: 1;
    }

    /* Zones panel only: both the Transition/Alignment selects and the
       Margins mini-fields share one uniform 48px row height — the select's
       own default (56px, used everywhere else in the editor) and the
       mini-field's original 32px were too far apart from each other; 40px
       (tried first) was judged too shallow. */
    .zone-band-grid chrono-cs-select::part(combobox) {
      height: 48px;
    }

    .zone-offset-mini::part(input) {
      height: 48px;
      font-size: 13px;
      text-align: center;
      padding: 0 4px;
    }

    /* ── Text fields ───────────────────────────────────────────────────────── */

    .text-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .text-field label,
    .toggle-field-spacer {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
      white-space: pre-line;
    }

    /* ── Color picker row ──────────────────────────────────────────────────── */

    .color-picker-row {
      display: flex;
      align-items: stretch;
      gap: 6px;
    }

    .color-picker-row input[type="color"] {
      width: 40px;
      min-width: 40px;
      height: 56px;
      padding: 4px;
      border: none;
      border-bottom: 1px solid var(--secondary-text-color, #888);
      border-radius: 4px 4px 0 0;
      background: var(--input-fill-color, rgba(0,0,0,0.06));
      cursor: pointer;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .color-picker-row chrono-cs-textfield {
      flex: 1;
    }

    /* ── Toggle fields ─────────────────────────────────────────────────────── */

    .toggle-field {
      display: flex;
      flex-direction: column;
      gap: 4px; /* must match .text-field's gap — this is what makes the
                   control row below start at the same Y as a paired
                   .text-field's control row */
    }

    .toggle-field-spacer {
      visibility: hidden;
    }

    .toggle-field-row {
      display: flex;
      flex-direction: row;
      gap: 12px;
      align-items: center;
    }

    .toggle-field label {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
    }

    /* ── Add / remove item buttons ─────────────────────────────────────────── */

    .add-item-row {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      margin-bottom: 4px;
    }

    .add-item-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      letter-spacing: 0.0892857em;
      text-transform: uppercase;
      height: 36px;
      padding: 0 8px;
      cursor: pointer;
      border-radius: 4px;
    }

    .add-item-btn:hover {
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.08);
    }

    .remove-item-row {
      display: flex;
      justify-content: center;
      margin-top: 8px;
      margin-bottom: 4px;
    }

    .remove-item-btn {
      background: none;
      border: none;
      color: var(--error-color, #f44336);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      letter-spacing: 0.0892857em;
      text-transform: uppercase;
      height: 36px;
      padding: 0 8px;
      cursor: pointer;
      border-radius: 4px;
    }

    .remove-item-btn:hover {
      background: rgba(244, 67, 54, 0.08);
    }

    /* ── Drag handle ───────────────────────────────────────────────────────── */

    .handle {
      cursor: move;
      cursor: grab;
      padding: 0 4px;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
    }

    .handle > * {
      pointer-events: none;
    }

    /* ── Item type badge ───────────────────────────────────────────────────── */

    .item-header-slot {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
    }

    .item-header-content {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
    }

    .item-header-content.item-hidden {
      opacity: 0.45;
    }

    .group-divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0 4px;
    }

    .group-divider-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }

    .group-divider-line {
      flex: 1;
      height: 1px;
      background: var(--divider-color, #444);
      opacity: 0.4;
    }

    .item-visibility-btn {
      background: none;
      border: none;
      padding: 0 4px;
      cursor: pointer;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .item-visibility-btn:hover {
      color: var(--primary-text-color);
    }

    .item-pos-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 6px;
      border-radius: 4px;
      color: white;
    }

    .item-type-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .item-type-badge.entity {
      background: var(--success-color, #4CAF50);
      color: white;
    }

    .item-type-badge.template {
      background: var(--info-color, #2196F3);
      color: white;
    }

  `;render(){if(!this._config)return html``;const t=this._config;return html`

      <!-- ── Card configuration ──────────────────────────────────────────────── -->

      <ha-expansion-panel header="Card configuration" outlined .expanded=${!1}>

        <!-- chrono_folder sensor entity -->
        <div class="card-row-1">
          ${csSelectField("Chrono-folder sensor",t.entity??"",chronoFolderEntities(this.hass),t=>this._valueChanged("entity",t))}
        </div>

        <!-- Sort by + reverse -->
        <div class="card-row">
          ${csSelectField("Sort by",t.sort_by??"filename",this._sortByOptions,t=>this._valueChanged("sort_by",t))}
          ${csToggleField("Reverse order",t.sort_reverse??!1,t=>this._toggleChanged("sort_reverse",t),"",!0)}
        </div>

        <!-- Display time + fit mode -->
        <div class="card-row">
          ${csTextField("Display time (seconds)",t.display_time??8,t=>this._numericValueChanged("display_time",t),{type:"number",step:"1",min:"1"})}
          ${csSelectField("Fit mode",t.fit_mode??"contain",this._fitModeOptions,t=>this._valueChanged("fit_mode",t))}
        </div>

        <!-- Transition + transition duration -->
        <div class="card-row">
          ${csSelectField("Transition",t.transition??"fade",this._transitionOptions,t=>this._valueChanged("transition",t))}
          ${csTextField("Transition duration (seconds)",t.transition_duration??.6,t=>this._numericValueChanged("transition_duration",t),{type:"number",step:"0.1",min:"0"})}
        </div>

        <!-- Dimmer -->
        <div class="card-row">
          ${csToggleField("Ambient dimmer",t.dimmer_enabled??!1,t=>this._toggleChanged("dimmer_enabled",t),"",!0)}
        </div>
        ${t.dimmer_enabled?html`
        <div class="card-row-1">
          <ha-entity-picker
            label="Ambient lux sensor"
            .hass=${this.hass}
            .value=${t.dimmer_entity??""}
            allow-custom-entity
            @value-changed=${t=>this._valueChanged("dimmer_entity",t)}
          ></ha-entity-picker>
        </div>
        <div class="card-row">
          ${csTextField("Minimum Ambient light (lux)",t.dimmer_lux_min??0,t=>this._numericValueChanged("dimmer_lux_min",t),{type:"number",step:"1",min:"0"})}
          ${csTextField("Maximum Ambient light (lux)",t.dimmer_lux_max??40,t=>this._numericValueChanged("dimmer_lux_max",t),{type:"number",step:"1",min:"0"})}
        </div>
        <div class="card-row">
          ${csTextField("Max opacity %",t.dimmer_max_opacity??80,t=>this._numericValueChanged("dimmer_max_opacity",t),{type:"number",step:"1",min:"0",max:"100"})}
          ${csTextField("Min opacity %",t.dimmer_min_opacity??0,t=>this._numericValueChanged("dimmer_min_opacity",t),{type:"number",step:"1",min:"0",max:"100"})}
        </div>
        <div class="card-row-1">
          <div class="slider-field">
            <label class="slider-label">Aggressiveness: ${t.dimmer_aggressiveness??DEFAULT_CONFIG.dimmer_aggressiveness}%</label>
            <input type="range" min="1" max="100" step="1"
              .value=${String(t.dimmer_aggressiveness??DEFAULT_CONFIG.dimmer_aggressiveness)}
              @change=${t=>this._numericValueChanged("dimmer_aggressiveness",t)}
            />
          </div>
        </div>
        `:""}

      </ha-expansion-panel>

      <!-- ── Zone modes panel ────────────────────────────────────────────────── -->

      ${this._renderZoneModesPanel()}

      <!-- ── Items panel ─────────────────────────────────────────────────────── -->

      ${this._renderItemsPanel()}

    `}}function _parseExifDateTime(t){if(!t)return NaN;const e=String(t).match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);if(!e)return NaN;const[,i,o,n,s,r,a]=e;return new Date(`${i}-${o}-${n}T${s}:${r}:${a}`).getTime()}function _parseFileDateTime(t){return t.fileDate?new Date(`${t.fileDate}T${t.fileTime??"00:00:00"}`).getTime():NaN}function _bestDateTime(t){const e=_parseExifDateTime(t.exifDateTimeOriginal??t.exifDateTime);return isNaN(e)?_parseFileDateTime(t):e}function sortFiles(t,e,i){let o;if("random"===e){o=[...t];for(let t=o.length-1;t>0;t--){const e=Math.floor(Math.random()*(t+1));[o[t],o[e]]=[o[e],o[t]]}return o}return o="exifdatetime"===e?[...t].sort((t,e)=>_bestDateTime(t)-_bestDateTime(e)):"filedatetime"===e?[...t].sort((t,e)=>_parseFileDateTime(t)-_parseFileDateTime(e)):[...t].sort((t,e)=>(t.fileName??"").localeCompare(e.fileName??"")),i?o.reverse():o}customElements.define("chrono-slideshow-card-editor",ChronoSlideshowCardEditor);const TRANSITION_EXIT_TRANSFORM={"slide-left":"translateX(-100%)","slide-right":"translateX(100%)","slide-up":"translateY(-100%)","slide-down":"translateY(100%)"},TRANSITION_ENTER_FROM_TRANSFORM={"slide-left":"translateX(100%)","slide-right":"translateX(-100%)","slide-up":"translateY(100%)","slide-down":"translateY(-100%)"};class ChronoSlideshowCard extends LitElement{static properties={_config:{attribute:!1},_files:{state:!0},_currentIndex:{state:!0},_itemValues:{state:!0},_loadError:{state:!0},_swipeOffset:{state:!0},_transitioning:{state:!0},_paused:{state:!0},_frontSlotId:{state:!0},_slotPhotoA:{state:!0},_slotPhotoB:{state:!0},_slotIntelligentSizeA:{state:!0},_slotIntelligentSizeB:{state:!0}};static getCardSize(){return 5}static getConfigElement(){return document.createElement("chrono-slideshow-card-editor")}static getStubConfig(t){const e=chronoFolderEntities(t);return{...DEFAULT_CONFIG,entity:e[0]?.value??"Create a folder watcher first in chrono-folder",items:[{template:"{{ fileName }}",vertical:"bottom",horizontal:"center",font_color:"white",font_size:1.1,font_weight:600}]}}constructor(){super(),this._config=null,this._hass=null,this._files=[],this._currentIndex=0,this._itemValues={},this._loadError=null,this._swipeOffset=0,this._transitioning=!1,this._paused=!1,this._holdTimer=null,this._holdFired=!1,this._lastTapTime=0,this._pendingTapTimer=null,this._itemSubs=new Map,this._subscribed=!1,this._timer=null,this._touchStartX=null,this._touchStartY=null,this._preloadedImages=new Map,this._frontSlotId="A",this._slotPhotoA=null,this._slotPhotoB=null,this._slotIntelligentSizeA=null,this._slotIntelligentSizeB=null,this._transitionTimeoutId=null,this._animationStartedFor=null,this._resolvedTransitionName="fade",this._transitionId=0,this._resizeObserver=null,this._observedCardEl=null}set hass(t){const e=this._hass;this._hass=t,this._config&&!this._subscribed&&this._loadFiles(),this._hassShouldRender(e,t)&&this.requestUpdate()}get hass(){return this._hass}_hassShouldRender(t,e){if(!t||!e)return!0;const i=this._config;if(!i)return!0;if(t.locale!==e.locale||t.formatEntityState!==e.formatEntityState)return!0;const o=new Set;i.entity&&o.add(i.entity);for(const t of i.items??[])t.entity&&o.add(t.entity);for(const i of o)if(t.states?.[i]!==e.states?.[i])return!0;return!1}setConfig(t){({config:t}=migrateConfig(t));const e=this._config;this._config=t;const i=!e||e.entity!==t.entity||e.sort_by!==t.sort_by||e.sort_reverse!==t.sort_reverse;this._hass&&(i?this._loadFiles():this._setupSubscriptions())}connectedCallback(){super.connectedCallback(),this._hass&&this._config&&!this._subscribed&&this._loadFiles(),this._startTimer(),this.style.setProperty("--editor-preview-aspect-ratio",isInsideEditDialog(this)?"16 / 10":"auto"),this.style.setProperty("--editor-preview-height",isInsideEditDialog(this)?"auto":"100%")}_attachResizeObserverIfNeeded(){const t=this.shadowRoot?.querySelector("ha-card");t&&t!==this._observedCardEl&&(this._resizeObserver?.disconnect(),this._observedCardEl=t,this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect?.height;e&&this.style.setProperty("--scale-factor",e/400)}),this._resizeObserver.observe(t))}disconnectedCallback(){super.disconnectedCallback(),this._teardownSubscriptions(),this._stopTimer(),this._resizeObserver?.disconnect()}_loadFiles(){const t=this._config?.entity,e=t?this._hass?.states?.[t]:null,i=e?.attributes?.files??[];this._files=sortFiles(i,this._config?.sort_by??"filename",this._config?.sort_reverse??!1),this._currentIndex=0,this._loadError=null,this._preloadedImages.clear(),this._frontSlotId="A",this._syncSlotsInstant(),this._setupSubscriptions(),this._preloadNeighbors(),this._restartTimer()}_photoAt(t){const e=this._files.length;if(0===e)return null;const i=((this._currentIndex+t)%e+e)%e;return this._files[i]}get _currentPhoto(){return this._photoAt(0)}get _nextPhoto(){return this._photoAt(1)}get _prevPhoto(){return this._photoAt(-1)}_preloadNeighbors(){for(const t of[this._prevPhoto,this._currentPhoto,this._nextPhoto]){if(!t)continue;const e=t.fileURL;if(!e||this._preloadedImages.has(e))continue;const i=new Image;i.src=e,this._preloadedImages.set(e,i)}const t=new Set([this._prevPhoto?.fileURL,this._currentPhoto?.fileURL,this._nextPhoto?.fileURL].filter(Boolean));for(const e of[...this._preloadedImages.keys()])t.has(e)||this._preloadedImages.delete(e)}_clearStaleAnimationState(){const t=this.shadowRoot?.querySelector(".slide-stack");t&&t.querySelectorAll(".slide-unit").forEach(t=>{t.getAnimations().forEach(t=>t.cancel()),t.style.maskImage=t.style.webkitMaskImage=""})}_syncSlotsInstant(){this._clearStaleAnimationState(),"A"===this._frontSlotId?(this._slotPhotoA=this._currentPhoto,this._slotPhotoB=this._nextPhoto):(this._slotPhotoB=this._currentPhoto,this._slotPhotoA=this._nextPhoto)}_promoteBackSlotInstant(){this._clearStaleAnimationState(),this._frontSlotId="A"===this._frontSlotId?"B":"A","A"===this._frontSlotId?this._slotPhotoB=this._nextPhoto:this._slotPhotoA=this._nextPhoto}_startTimer(){if(this._timer||this._paused)return;const t=Math.max(1,this._config?.display_time??8);this._timer=setInterval(()=>this._advance(),1e3*t)}_stopTimer(){this._timer&&(clearInterval(this._timer),this._timer=null)}_restartTimer(){this._stopTimer(),this._startTimer()}_advance(){if(0===this._files.length||this._transitioning)return;const t=this._files.length,e=this._config?.transition??"fade",i="random"===e?pickRandomTransition():e;if(this._resolvedTransitionName=i,this._currentIndex=(this._currentIndex+1)%t,this._loadError=null,this._setupSubscriptions(),this._preloadNeighbors(),this._restartTimer(),"none"===i)return this._promoteBackSlotInstant(),void this.requestUpdate();this._frontSlotId="A"===this._frontSlotId?"B":"A",this._transitioning=!0,this._transitionId=(this._transitionId??0)+1,this.requestUpdate();const o=1e3*Math.max(0,this._config?.transition_duration??.6);this._transitionTimeoutId&&clearTimeout(this._transitionTimeoutId),this._transitionTimeoutId=setTimeout(()=>{this._transitioning=!1,"A"===this._frontSlotId?this._slotPhotoB=this._nextPhoto:this._slotPhotoA=this._nextPhoto,this.requestUpdate()},o+50)}_manualNavigate(t){if(0===this._files.length||this._transitioning)return;const e=this._files.length;this._currentIndex=((this._currentIndex+t)%e+e)%e,this._loadError=null,this._setupSubscriptions(),this._preloadNeighbors(),this._restartTimer(),t>0?this._promoteBackSlotInstant():this._syncSlotsInstant(),this.requestUpdate()}_togglePause(){this._paused=!this._paused,this._paused?this._stopTimer():this._restartTimer()}_onPointerDown(t){this._transitioning||(t.currentTarget.setPointerCapture(t.pointerId),this._touchStartX=t.clientX,this._touchStartY=t.clientY,this._holdFired=!1,this._holdTimer&&clearTimeout(this._holdTimer),this._holdTimer=setTimeout(()=>{this._holdFired=!0,this._handleAction(this._config,"hold")},500))}_onPointerUp(t){if(null===this._touchStartX)return;const e=t.clientX-this._touchStartX,i=t.clientY-this._touchStartY;this._touchStartX=null,this._touchStartY=null,this._holdTimer&&(clearTimeout(this._holdTimer),this._holdTimer=null);const o=Math.abs(e)>=40&&Math.abs(e)>=Math.abs(i),n=Math.abs(i)>=40&&Math.abs(i)>Math.abs(e);if(o)return void(this._holdFired||this._manualNavigate(e<0?1:-1));if(n)return void(this._holdFired||this._handleAction(this._config,i<0?"swipe_up":"swipe_down"));if(this._holdFired)return;const s=Date.now();if(s-this._lastTapTime<250)return this._lastTapTime=0,this._pendingTapTimer&&(clearTimeout(this._pendingTapTimer),this._pendingTapTimer=null),void this._handleAction(this._config,"double_tap");this._lastTapTime=s,this._pendingTapTimer&&clearTimeout(this._pendingTapTimer),this._pendingTapTimer=setTimeout(()=>{this._pendingTapTimer=null,this._togglePause()},250)}_onPointerCancel(){this._touchStartX=null,this._touchStartY=null,this._holdTimer&&(clearTimeout(this._holdTimer),this._holdTimer=null)}_onPointerMove(t){if(null===this._touchStartX||!this._holdTimer)return;const e=t.clientX-this._touchStartX,i=t.clientY-this._touchStartY;(Math.abs(e)>=40||Math.abs(i)>=40)&&(clearTimeout(this._holdTimer),this._holdTimer=null)}_setupSubscriptions(){this._itemSubs||(this._itemSubs=new Map);const t=this._currentPhoto,e=this._config?.items??[],i=this._config??{},o=new Set,n=t=>t.replace(/_([a-z])/g,(t,e)=>e.toUpperCase()),s={},r=new Set(["zone_modes","zone_alignment","items"]);for(const t of Object.keys(DEFAULT_CONFIG)){if(r.has(t))continue;s["card"+n(t).replace(/^./,t=>t.toUpperCase())]=i[t]??DEFAULT_CONFIG[t]}s.cardDimmerOpacity=Math.round(1e3*this._computeDimmerOpacity())/10;const a={...s,...t};e.forEach((t,e)=>{if(!("template"in t))return;const i=`item-${e}`;o.add(i);const{text:n,fullyLiteral:s}=substitutePhotoVariables(t.template??"",a),r=this._itemSubs.get(i);if(r&&r.substituted===n)return;if(r?.unsub&&this._unsubscribeOne(r.unsub),s)return this._itemValues={...this._itemValues,[i]:n},void this._itemSubs.set(i,{substituted:n,unsub:null});const l=this._hass.connection.subscribeMessage(t=>{this._itemValues={...this._itemValues,[i]:t.result}},{type:"render_template",template:n});this._itemSubs.set(i,{substituted:n,unsub:l})});for(const[t,e]of[...this._itemSubs.entries()])if(!o.has(t)){e.unsub&&this._unsubscribeOne(e.unsub),this._itemSubs.delete(t);const{[t]:i,...o}=this._itemValues;this._itemValues=o}this._subscribed=!0}_unsubscribeOne(t){Promise.resolve(t).then(t=>{"function"==typeof t&&t()}).catch(()=>{})}_teardownSubscriptions(){if(this._itemSubs){for(const t of this._itemSubs.values())t.unsub&&this._unsubscribeOne(t.unsub);this._itemSubs.clear()}this._subscribed=!1}_handleAction(t,e="tap"){this._hass&&handleAction(this,this._hass,t,e)}_itemStyleMap(t){const e=t=>""!==t&&null!=t?`calc(${t}px * var(--scale-factor, 1))`:void 0,i=t=>""!==t&&null!=t?`${t}`:void 0;return{color:t.font_color||void 0,"font-size":(o=t.font_size,""!==o&&null!=o?`calc(${o}em * var(--scale-factor, 1))`:void 0),"font-weight":i(t.font_weight),"line-height":i(t.line_height),"border-radius":e(t.border_radius),"background-color":t.background_color||void 0,"padding-top":e(t.padding_vertical),"padding-bottom":e(t.padding_vertical),"padding-left":e(t.padding_horizontal),"padding-right":e(t.padding_horizontal),"margin-top":e(t.margin_top),"margin-bottom":e(t.margin_bottom),"text-shadow":t.text_shadow_color&&""!==t.text_shadow_offset_x&&""!==t.text_shadow_offset_y?Array(Math.max(1,Number(t.text_shadow_layers??2)||1)).fill(`${e(t.text_shadow_offset_x??0)} ${e(t.text_shadow_offset_y??0)} ${e(t.text_shadow_blur??0)} ${t.text_shadow_color}`).join(", "):void 0,"-webkit-text-stroke-width":t.text_shadow_color?e(t.text_shadow_stroke_width??0):void 0,"-webkit-text-stroke-color":t.text_shadow_color||void 0};var o}_renderItem(t,e){if(!1===t.show)return html``;if("template"in t){const i=`item-${e}`,o=this._itemValues[i]??"",n=t.tap_action&&"none"!==t.tap_action.action;return html`
        <span
          class="overlay-template-item${n?" clickable":""}"
          style=${styleMap(this._itemStyleMap(t))}
          @click=${n?()=>this._handleAction(t):void 0}
        >${o}</span>
      `}if("entity"in t){const e=this._hass?.states?.[t.entity];if(!e)return html`
          <span class="overlay-entity-missing" title="Entity not found: ${t.entity}">!</span>
        `;const i={...t,entity:t.entity},o=t.show_state?t.attribute?`${t.prefix??""}${e.attributes?.[t.attribute]??""}${t.suffix??""}`:this._hass?.formatEntityState?this._hass.formatEntityState(e):e.state:"";return html`
        <div
          class="overlay-entity-item"
          style=${styleMap(this._itemStyleMap(t))}
          title="${e.attributes.friendly_name??t.entity}: ${e.state}"
          @click=${t=>{t.stopPropagation(),this._handleAction(i)}}
        >
          <ha-state-icon
            .hass=${this._hass}
            .stateObj=${e}
            .icon=${t.icon||void 0}
          ></ha-state-icon>
          ${t.show_state?html`<span class="entity-state-label">${o}</span>`:""}
        </div>
      `}return html``}_renderZoneItems(t,e,i){const o=(this._config?.items??[]).filter(i=>(i.horizontal??"center")===e&&(i.vertical??"middle")===t);if(0===o.length)return html``;const n=`${t}-${e}`,s=this._config?.zone_alignment?.[n]??DEFAULT_ZONE_ALIGNMENT[n]??e,r=this._config?.zone_offset_x?.[n]??DEFAULT_ZONE_OFFSET_X[n]??0,a=this._config?.zone_offset_y?.[n]??DEFAULT_ZONE_OFFSET_Y[n]??0;return html`
      <div
        class="overlay-zone overlay-zone-align-${s}"
        style="transform: translate(calc(${r}px * var(--scale-factor, 1)), calc(${-a}px * var(--scale-factor, 1)));"
      >
        ${o.map(t=>this._renderItem(t,i.get(t)))}
      </div>
    `}_renderZoneGrid(t,e){const i=this._config?.zone_modes??DEFAULT_ZONE_MODES,o=["top","middle","bottom"].map(o=>{const n=["left","center","right"].map(n=>(i[`${o}-${n}`]??"static")!==t?html`<div class="overlay-cell"></div>`:html`<div class="overlay-cell">${this._renderZoneItems(o,n,e)}</div>`);return html`<div class="overlay-row">${n}</div>`});return html`<div class="overlay-grid overlay-grid-${t}">${o}</div>`}_onImageError(t){this._loadError=t?.fileName??"unknown file",this.requestUpdate()}_onSlideImageLoad(t,e,i){if("intelligent"!==e)return;const o=t.target,n=this.shadowRoot?.querySelector("ha-card"),s=n?.getBoundingClientRect();if(!(s&&s.width&&s.height&&o.naturalWidth&&o.naturalHeight))return;const r=this._config??{},a=computeIntelligentFit(o.naturalWidth,o.naturalHeight,s.width,s.height,(r.maxZoom??DEFAULT_CONFIG.maxZoom)/100,(r.maxStretch??DEFAULT_CONFIG.maxStretch)/100,(r.maxGap??DEFAULT_CONFIG.maxGap)/100);"A"===i?this._slotIntelligentSizeA=a:this._slotIntelligentSizeB=a}_renderSlideUnit(t,e,i,o,n){if(!t)return html``;const s=this._config?.letterbox_color||void 0,r="A"===n?this._slotIntelligentSizeA:this._slotIntelligentSizeB,a=this._config?.zoomCenter??DEFAULT_CONFIG.zoomCenter,l="intelligent"===i&&r?{position:"absolute",top:`${a}%`,left:"50%",width:`${r.renderWidth}px`,height:`${r.renderHeight}px`,transform:`translate(-50%, -${a}%)`,"background-color":s}:{"object-fit":"intelligent"===i?"contain":i,"background-color":s};return html`
      <div class="slide-unit" data-role="${o??""}" style=${styleMap({"background-color":s})}>
        <img
          class="slide-image"
          src="${t.fileURL}"
          style=${styleMap(l)}
          draggable="false"
          @load=${t=>this._onSlideImageLoad(t,i,n)}
          @error=${()=>this._onImageError(t)}
        >
        ${this._renderZoneGrid("dynamic",e)}
      </div>
    `}_runTransitionAnimations(){if(!this._transitioning)return;const t=this.shadowRoot?.querySelector(".slide-stack");if(!t)return;const e=t.querySelector('.slide-unit[data-role="back"]'),i=t.querySelector('.slide-unit[data-role="front"]');if(!e||!i)return;if(this._animationStartedFor===this._transitionId)return;this._animationStartedFor=this._transitionId,e.getAnimations().forEach(t=>t.cancel()),i.getAnimations().forEach(t=>t.cancel());const o=this._resolvedTransitionName??"fade",n=1e3*Math.max(0,this._config?.transition_duration??.6),s="ease",r={opacity:1,transform:"translate(0,0)",clipPath:"inset(0 0 0 0)",maskImage:"none",webkitMaskImage:"none"};if("fade"===o)e.animate([{...r,opacity:1},{...r,opacity:0}],{duration:n,easing:s,fill:"forwards"}),i.animate([{...r,opacity:0},{...r,opacity:1}],{duration:n,easing:s,fill:"forwards"});else if(o.startsWith("slide-")){const t=TRANSITION_EXIT_TRANSFORM[o]??"translateX(-100%)",a=TRANSITION_ENTER_FROM_TRANSFORM[o]??"translateX(100%)";e.animate([{...r,transform:"translate(0,0)"},{...r,transform:t}],{duration:n,easing:s,fill:"forwards"}),i.animate([{...r,transform:a},{...r,transform:"translate(0,0)"}],{duration:n,easing:s,fill:"forwards"})}else if("curtain"===o)e.animate([{...r,clipPath:"inset(0 0 0 0)"},{...r,clipPath:"inset(0 0 0 100%)"}],{duration:n,easing:s,fill:"forwards"}),i.animate([{...r,clipPath:"inset(0 100% 0 0)"},{...r,clipPath:"inset(0 0 0 0)"}],{duration:n,easing:s,fill:"forwards"});else if("clock"===o){e.animate([{...r},{...r}],{duration:n,fill:"forwards"});const t=60,o=Array.from({length:t+1},(e,i)=>{const o=360*i/t,n=`conic-gradient(from 0deg, #000 ${o}deg, transparent ${o}deg)`;return{...r,maskImage:n,webkitMaskImage:n}});i.animate(o,{duration:n,easing:"linear",fill:"forwards"})}}updated(t){super.updated(t),this._attachResizeObserverIfNeeded(),this._transitioning&&this._runTransitionAnimations()}static styles=css`
    :host {
      display: block;
      height: 100%;
    }
    ha-card {
      position: relative;
      width: 100%;
      height: var(--editor-preview-height, 100%);
      min-height: 200px;
      aspect-ratio: var(--editor-preview-aspect-ratio, auto);
      overflow: hidden;
      box-sizing: border-box;
    }
    .slideshow-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      touch-action: none;
    }

    /* ── Pause indicator: shown on tap-to-pause, hidden on tap-to-resume ──── */
    .pause-indicator {
      position: absolute;
      left: 50%;
      top: 75%;
      transform: translate(-50%, -50%);
      width: calc(64px * var(--scale-factor, 1));
      height: calc(64px * var(--scale-factor, 1));
      border-radius: 50%;
      border: calc(2px * var(--scale-factor, 1)) solid white;
      background: rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 4;
      pointer-events: none;
    }
    .pause-indicator ha-icon {
      --mdc-icon-size: calc(36px * var(--scale-factor, 1));
      color: white;
    }

    /* ── Dimmer overlay: sits above photo, overlays, and pause indicator ─────── */
    .dimmer-overlay {
      position: absolute;
      inset: 0;
      z-index: 5;
      pointer-events: none;
    }

    /* ── Static overlay layer: outside the transitioning subtree ────────────── */
    .overlay-grid-static {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
    }

    /* ── Slide stack: holds the two persistent slide units (front + back) ──── */
    .slide-stack {
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow: hidden;
    }
    .slide-unit {
      position: absolute;
      inset: 0;
      will-change: transform, opacity, clip-path;
      background-color: var(--card-background-color, #1c1c1c);
    }
    .slide-unit[data-role="back"]  { z-index: 1; }
    .slide-unit[data-role="front"] { z-index: 2; }
    .slide-image {
      display: block;
      width: 100%;
      height: 100%;
      background-color: var(--card-background-color, #1c1c1c);
    }

    /* ── Dynamic overlay layer: inside each slide unit, rides with it ───────── */
    .overlay-grid-dynamic {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
    }

    /* ── 9-zone grid layout shared by static and dynamic layers ─────────────── */
    .overlay-grid {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    .overlay-row {
      display: flex;
      flex-direction: row;
      flex: 1;
    }
    .overlay-cell {
      flex: 1;
      display: flex;
      min-width: 0;
      min-height: 0;
    }
    .overlay-row:nth-child(1) .overlay-cell { align-items: flex-start; }
    .overlay-row:nth-child(2) .overlay-cell { align-items: center;    }
    .overlay-row:nth-child(3) .overlay-cell { align-items: flex-end;  }
    .overlay-cell:nth-child(1) { justify-content: flex-start; }
    .overlay-cell:nth-child(2) { justify-content: center;     }
    .overlay-cell:nth-child(3) { justify-content: flex-end;   }

    .overlay-zone {
      display: flex;
      flex-direction: column;
      gap: calc(4px * var(--scale-factor, 1));
      pointer-events: auto;
    }
    /* Keyed by the zone's configured alignment (zone_alignment), not its
       screen position — the two are independent since 0.0.23. */
    .overlay-zone-align-left   { align-items: flex-start; text-align: left;   }
    .overlay-zone-align-center { align-items: center;     text-align: center; }
    .overlay-zone-align-right  { align-items: flex-end;   text-align: right;  }

    .overlay-template-item {
      color: var(--ha-picture-card-text-color, white);
      white-space: pre-wrap;
      line-height: 1.4;
    }
    .overlay-template-item.clickable {
      cursor: pointer;
    }
    .overlay-entity-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      min-width: calc(40px * var(--scale-factor, 1));
    }
    .overlay-entity-item ha-state-icon {
      --mdc-icon-size: calc(24px * var(--scale-factor, 1));
    }
    .entity-state-label {
      display: block;
      font-size: calc(10px * var(--scale-factor, 1));
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--ha-picture-card-text-color, white);
      max-width: calc(96px * var(--scale-factor, 1));
    }
    .overlay-entity-missing {
      color: var(--error-color, #f44336);
      font-weight: bold;
      padding: 0 calc(4px * var(--scale-factor, 1));
    }

    /* ── Transitions ──────────────────────────────────────────────────────────
       Animated via the Web Animations API (element.animate()) in
       _runTransitionAnimations(), not via CSS classes — explicit keyframes
       avoid needing a forced reflow between an initial and transitioned
       state. These rules only establish the base stacking; no transition-
       specific classes are needed here. */

    /* ── Empty / error states ────────────────────────────────────────────────── */
    .message-overlay {
      position: absolute;
      inset: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: calc(24px * var(--scale-factor, 1));
      box-sizing: border-box;
      color: var(--secondary-text-color);
      background: var(--card-background-color, #1c1c1c);
    }
    .message-overlay .message-icon {
      --mdc-icon-size: calc(48px * var(--scale-factor, 1));
      display: block;
      margin: 0 auto calc(12px * var(--scale-factor, 1));
      color: var(--secondary-text-color);
    }
  `;_computeDimmerOpacity(){const t=this._config,e=t.dimmer_entity??"";if(!e)return 0;const i=this._hass?.states?.[e],o=i?parseFloat(i.state):0;if(isNaN(o))return 0;const n=t.dimmer_lux_min??DEFAULT_CONFIG.dimmer_lux_min,s=t.dimmer_lux_max??DEFAULT_CONFIG.dimmer_lux_max,r=(t.dimmer_min_opacity??DEFAULT_CONFIG.dimmer_min_opacity)/100,a=(t.dimmer_max_opacity??DEFAULT_CONFIG.dimmer_max_opacity)/100,l=t.dimmer_aggressiveness??DEFAULT_CONFIG.dimmer_aggressiveness,d=Math.pow(10,(l-50)/50);if(s<=n)return a;const c=Math.max(0,Math.min(1,(o-n)/(s-n)));return a+(r-a)*Math.pow(c,.33*d)}render(){if(!this._config||!this._hass)return html``;const t=this._config,e=t.fit_mode??"contain",i=new Map((t.items??[]).map((t,e)=>[t,e])),o=t.entity;return(o?this._hass?.states?.[o]:null)?0===this._files.length?html`
        <ha-card>
          <div class="slideshow-container">
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:image-off-outline"></ha-icon>
                <div>No photos found</div>
              </div>
            </div>
          </div>
        </ha-card>
      `:html`
      <ha-card>
        <div
          class="slideshow-container"
          @pointerdown=${t=>this._onPointerDown(t)}
          @pointermove=${t=>this._onPointerMove(t)}
          @pointerup=${t=>this._onPointerUp(t)}
          @pointercancel=${()=>this._onPointerCancel()}
        >
          ${this._renderZoneGrid("static",i)}

          <div class="slide-stack">
            ${this._renderSlideUnit(this._slotPhotoA,i,e,"A"===this._frontSlotId?"front":"back","A")}
            ${this._renderSlideUnit(this._slotPhotoB,i,e,"B"===this._frontSlotId?"front":"back","B")}
          </div>

          ${this._paused?html`
            <div class="pause-indicator">
              <ha-icon icon="mdi:pause"></ha-icon>
            </div>
          `:""}

          ${this._loadError?html`
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:image-broken-variant"></ha-icon>
                <div>Failed to load: ${this._loadError}</div>
              </div>
            </div>
          `:""}

          ${this._config.dimmer_enabled&&this._config.dimmer_entity?html`
            <div class="dimmer-overlay" style="
              background-color: ${this._config.dimmer_color??DEFAULT_CONFIG.dimmer_color};
              opacity: ${this._computeDimmerOpacity()};
            "></div>
          `:""}
        </div>
      </ha-card>
    `:html`
        <ha-card>
          <div class="slideshow-container">
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:folder-alert-outline"></ha-icon>
                <div>Sensor not found: ${o||"(not configured)"}</div>
              </div>
            </div>
          </div>
        </ha-card>
      `}}customElements.define("chrono-slideshow-card",ChronoSlideshowCard),window.customCards=window.customCards||[],window.customCards.push({type:"chrono-slideshow-card",name:"Chrono Slideshow Card",description:"Slideshow of images from a chrono_folder sensor, with configurable overlays, transitions, and swipe navigation.",preview:!0});