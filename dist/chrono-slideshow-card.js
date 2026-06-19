import{LitElement,html,css}from"https://unpkg.com/lit@2.0.0/index.js?module";import{live}from"https://unpkg.com/lit@2.0.0/directives/live.js?module";import{styleMap}from"https://unpkg.com/lit@2.0.0/directives/style-map.js?module";import{unsafeHTML}from"https://unpkg.com/lit@2.0.0/directives/unsafe-html.js?module";import{repeat}from"https://unpkg.com/lit@2.0.0/directives/repeat.js?module";import jsyaml from"https://cdn.jsdelivr.net/npm/js-yaml@4/+esm";const CARD_VERSION="0.0.10",mdiDragHorizontalVariant="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z";console.info("%c CHRONO-%cSLIDESHOW%c-CARD %c v0.0.10 ","background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 0 2px 4px; border-radius: 3px 0 0 3px;","background-color: #101010; color: #4676d3; font-weight: bold; padding: 2px 0;","background-color: #101010; color: #FFFFFF; font-weight: bold; padding: 2px 4px 2px 0;","background-color: #1E1E1E; color: #FFFFFF; font-weight: bold; padding: 2px 4px; border-radius: 0 3px 3px 0;");const DEFAULT_ITEM={_id:"",show:!0,horizontal:"center",vertical:"middle",icon:"",show_state:!1,font_color:"",font_size:1.2,font_weight:600,line_height:1.2,border_radius:50,background_color:"",padding_top:10,padding_bottom:10,padding_left:10,padding_right:10},DEFAULT_ENTITY_ITEM={...DEFAULT_ITEM,entity:""},DEFAULT_TEMPLATE_ITEM={...DEFAULT_ITEM,template:""},DEFAULT_ZONE_MODES={"top-left":"static","top-center":"static","top-right":"static","middle-left":"dynamic","middle-center":"dynamic","middle-right":"dynamic","bottom-left":"static","bottom-center":"static","bottom-right":"dynamic"},REFERENCE_HEIGHT_PX=400,DEFAULT_CONFIG={entity:"sensor.",sort_by:"filename",sort_reverse:!1,display_time:8,transition:"fade",transition_duration:.6,fit_mode:"contain",zone_modes:{...DEFAULT_ZONE_MODES},items:[]},NUMERIC_ITEM_KEYS=new Set(["font_size","font_weight","line_height","border_radius","padding_top","padding_bottom","padding_left","padding_right"]),UI_ITEM_KEYS=new Set(["_id","show","entity","template","horizontal","vertical","icon","show_state","font_color","font_size","font_weight","line_height","border_radius","background_color","padding_top","padding_bottom","padding_left","padding_right"]),UI_CARD_KEYS=new Set(["type","entity","sort_by","sort_reverse","display_time","transition","transition_duration","fit_mode","zone_modes","items"]),VERTICAL_OPTIONS=[{label:"Top",value:"top"},{label:"Middle",value:"middle"},{label:"Bottom",value:"bottom"}],HORIZONTAL_OPTIONS=[{label:"Left",value:"left"},{label:"Center",value:"center"},{label:"Right",value:"right"}],SORT_BY_OPTIONS=[{label:"Filename",value:"filename"},{label:"File date/time",value:"filedatetime"},{label:"Capture date/time",value:"exifdatetime"},{label:"Random",value:"random"}],TRANSITION_OPTIONS=[{label:"Fade",value:"fade"},{label:"Slide left",value:"slide-left"},{label:"Slide right",value:"slide-right"},{label:"Slide up",value:"slide-up"},{label:"Slide down",value:"slide-down"},{label:"Curtain",value:"curtain"},{label:"Clock",value:"clock"},{label:"None",value:"none"}],FIT_MODE_OPTIONS=[{label:"Cover",value:"cover"},{label:"Contain",value:"contain"},{label:"Fill",value:"fill"}],ZONE_MODE_OPTIONS=[{label:"Static",value:"static"},{label:"Dynamic",value:"dynamic"}],SHOW_ITEM_POSITION_BADGES=!1,VERTICAL_BADGE_COLORS={top:"#ac00ac",middle:"#c77c00",bottom:"#0600ff"},HORIZONTAL_BADGE_COLORS={left:"#bb9e00",center:"#10a800",right:"#00a896"},GROUP_DIVIDER_COLOR="#009ac7",_GROUP_DEFS=[{vertical:"top",horizontal:"left",label:"Top · Left"},{vertical:"top",horizontal:"center",label:"Top · Center"},{vertical:"top",horizontal:"right",label:"Top · Right"},{vertical:"middle",horizontal:"left",label:"Middle · Left"},{vertical:"middle",horizontal:"center",label:"Middle · Center"},{vertical:"middle",horizontal:"right",label:"Middle · Right"},{vertical:"bottom",horizontal:"left",label:"Bottom · Left"},{vertical:"bottom",horizontal:"center",label:"Bottom · Center"},{vertical:"bottom",horizontal:"right",label:"Bottom · Right"}],_GROUP_ORDER=_GROUP_DEFS.map(t=>`${t.vertical}-${t.horizontal}`);function sortItems(t){const e=t=>`${t.vertical??"middle"}-${t.horizontal??"center"}`;return[...t].sort((t,i)=>_GROUP_ORDER.indexOf(e(t))-_GROUP_ORDER.indexOf(e(i)))}function generateId(t=[]){const e=new Set(t.map(t=>t._id));let i;do{i=Math.random().toString(16).slice(2,10)}while(e.has(i));return i}function migrateConfig(t){let e=!1;if(t.items?.some(t=>!t._id)){const i=[];for(const e of t.items)i.push(e._id?e:{...e,_id:generateId(t.items.concat(i))});t={...t,items:i},e=!0}const i=t.zone_modes??{};return Object.keys(DEFAULT_ZONE_MODES).some(t=>!(t in i))&&(t={...t,zone_modes:{...DEFAULT_ZONE_MODES,...i}},e=!0),{config:t,migrated:e}}function serializeExtrasToYaml(t,e){const i={};for(const[o,n]of Object.entries(t))e.has(o)||(i[o]=n);if(!Object.keys(i).length)return"";try{return jsyaml.dump(i,{indent:2}).trimEnd()}catch(t){return""}}function parseYamlExtras(t){const e=(t??"").trim();if(!e)return{};try{const t=jsyaml.load(e);return t&&"object"==typeof t&&!Array.isArray(t)?t:null}catch(t){return null}}function fireEvent(t,e,i={},o={}){const n=new Event(e,{bubbles:o.bubbles??!0,cancelable:Boolean(o.cancelable),composed:o.composed??!0});return n.detail=i,t.dispatchEvent(n),n}function navigate(t,e={}){e.replace?history.replaceState(null,"",t):history.pushState(null,"",t),fireEvent(window,"location-changed",{replace:e.replace??!1})}function toggleEntity(t,e){e&&t.callService("homeassistant","toggle",{entity_id:e})}function handleAction(t,e,i,o){let n;switch("double_tap"===o&&i.double_tap_action?n=i.double_tap_action:"hold"===o&&i.hold_action?n=i.hold_action:"tap"===o&&i.tap_action&&(n=i.tap_action),n||(n={action:"none"}),n.action){case"none":default:break;case"more-info":fireEvent(t,"hass-more-info",{entityId:n.entity??i.entity});break;case"navigate":n.navigation_path&&navigate(n.navigation_path,{replace:n.navigation_replace});break;case"url":n.url_path&&window.open(n.url_path,"_blank");break;case"toggle":toggleEntity(e,i.entity);break;case"perform-action":case"call-service":{const t=n.perform_action??n.service;if(!t)break;const[i,o]=t.split(".",2);if(!i||!o)break;e.callService(i,o,n.data??n.service_data,n.target);break}case"fire-dom-event":fireEvent(t,"ll-custom",n)}}function csParseNumber(t){const e=String(t).replace(",",".");if("-"===e||"-0"===e||e.endsWith("."))return null;if(""===e)return"";const i=parseFloat(e);return isNaN(i)||String(i)!==e?null:i}const _TEMPLATE_EXPR_RE=/\{\{(.*?)\}\}/gs,_IDENTIFIER_RE=/[A-Za-z_][A-Za-z0-9_]*/g;function _jinjaLiteral(t){if(null==t)return"''";const e=String(t);return""===e?"''":/^-?\d+(\.\d+)?$/.test(e)||"true"===e||"false"===e?e:`'${e.replace(/\\/g,"\\\\").replace(/'/g,"\\'")}'`}function substitutePhotoVariables(t,e){const i=String(t??"");if(!i.includes("{{")||!e)return{text:i,fullyLiteral:!i.includes("{{")};let o=!0;const n=[];i.replace(_TEMPLATE_EXPR_RE,(t,i)=>{const r=i.trim(),s=/^[A-Za-z_][A-Za-z0-9_]*$/.test(r)&&Object.prototype.hasOwnProperty.call(e,r);return s||(o=!1),n.push({inner:i,isPhotoField:s,field:s?r:null}),t});let r=0;if(o){return{text:i.replace(_TEMPLATE_EXPR_RE,()=>{const{field:t}=n[r++],i=e[t];return null==i?"":String(i)}),fullyLiteral:!0}}return{text:i.replace(_TEMPLATE_EXPR_RE,(t,i)=>`{{${i.replace(_IDENTIFIER_RE,t=>Object.prototype.hasOwnProperty.call(e,t)?_jinjaLiteral(e[t]):t)}}}`),fullyLiteral:!1}}function csTextField(t,e,i,o={}){return html`
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
  `}function csToggleField(t,e,i,o=""){return html`
    <div class="toggle-field ${o}">
      <label>${unsafeHTML(t)}</label>
      <ha-switch .checked=${e} @change=${i}></ha-switch>
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
      <label>${unsafeHTML(t)}</label>
      <chrono-cs-select
        .value=${e??""}
        .options=${i}
        @change=${o}
      ></chrono-cs-select>
    </div>
  `}function csButtonPicker(t,e,i,o,n="",r=""){return html`
    <div class="button-picker-field ${r}" style=${"end"===n?"justify-self:end":""}>
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
  `;render(){const t=this.options??[];return html`${t.map((e,i)=>{const o=1===t.length,n=0===i,r=i===t.length-1,s=[e.value===this.value?"active":"",o?"only":n?"first":r?"last":""].filter(Boolean).join(" ");return html`
        <button class="${s}" @click=${()=>this._select(e.value)}>${e.label}</button>
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
      <div class="combobox ${this._open?"combobox-open":""}">
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
    `}focus(){this.shadowRoot?.querySelector(".combobox-input")?.focus()}}customElements.define("chrono-cs-select",CsSelect);class ChronoSlideshowCardEditor extends LitElement{static properties={hass:{attribute:!1},_config:{state:!0},_expandedItemId:{state:!0},_removedItem:{state:!0}};setConfig(t){const{config:e,migrated:i}=migrateConfig(t);this._config=e,i&&this._fireConfig()}_fireConfig(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}_valueChanged(t,e){if(!this._config)return;this._clearUndo();const i=e.target.value??e.detail?.value;this._config={...this._config,[t]:i},this._fireConfig()}_numericValueChanged(t,e){if(!this._config)return;this._clearUndo();const i=csParseNumber(e.target.value??e.detail?.value);null!==i&&(this._config={...this._config,[t]:i},this._fireConfig())}_toggleChanged(t,e){if(!this._config)return;this._clearUndo();const i=e.target.checked;this._config={...this._config,[t]:i},this._fireConfig()}_zoneModeChanged(t,e){if(!this._config)return;this._clearUndo();const i=e.target.value??e.detail?.value,o={...this._config.zone_modes??DEFAULT_ZONE_MODES,[t]:i};this._config={...this._config,zone_modes:o},this._fireConfig()}_itemChanged(t,e,i){if(!this._config)return;this._clearUndo();const o=i.target.value??i.detail?.value;let n;if(NUMERIC_ITEM_KEYS.has(e)){const t=csParseNumber(o);if(null===t)return;n=t}else n=o;let r=[...this._config.items??[]];r[t]={...r[t],[e]:n},"horizontal"!==e&&"vertical"!==e||(r=sortItems(r)),this._config={...this._config,items:r},this._fireConfig()}_itemYamlChanged(t,e){if(!this._config)return;this._clearUndo();const i=parseYamlExtras(e.target.value??e.detail?.value??"");if(null===i)return;const o=[...this._config.items??[]],n=o[t],r={};for(const[t,e]of Object.entries(n))UI_ITEM_KEYS.has(t)&&(r[t]=e);o[t]={...r,...i},this._config={...this._config,items:o},this._fireConfig()}_itemToggled(t,e,i){if(!this._config)return;this._clearUndo();const o=i.target.checked,n=[...this._config.items??[]];n[t]={...n[t],[e]:o},this._config={...this._config,items:n},this._fireConfig()}_addItem(t){const e=this._config.items??[];let i="";if("entity"===t){const t=this.hass?.states??{};i=Object.keys(t).find(t=>t.startsWith("light."))??Object.keys(t)[0]??""}else i="{{ now().strftime('%H:%M') }}";const o="entity"===t?{...DEFAULT_ENTITY_ITEM,_id:generateId(e),entity:i}:{...DEFAULT_TEMPLATE_ITEM,_id:generateId(e),template:i},n=sortItems([...e,o]);this._expandedItemId=o._id,this._removedItem=null,this._config={...this._config,items:n},this._fireConfig(),this.updateComplete.then(async()=>{const t=this.shadowRoot?.querySelector(`[data-item-id="${o._id}"]`);t&&(await t.updateComplete,t.scrollIntoView({behavior:"smooth",block:"nearest"}),t.querySelector("chrono-cs-textfield")?.focus())})}_removeItem(t){const e=[...this._config.items??[]];this._removedItem={item:e[t],index:t},this._config={...this._config,items:e.filter((e,i)=>i!==t)},this._fireConfig()}_undoRemove(){if(!this._removedItem)return;const{item:t,index:e}=this._removedItem,i=[...this._config.items??[]];i.splice(e,0,t),this._removedItem=null,this._config={...this._config,items:i},this._fireConfig()}_clearUndo(){this._removedItem&&(this._removedItem=null)}_buildRows(t){const e=[];let i=0;for(const o of _GROUP_DEFS)e.push({type:"divider",group:o,key:`divider-${o.vertical}-${o.horizontal}`}),t.forEach((t,n)=>{(t.vertical??"middle")===o.vertical&&(t.horizontal??"center")===o.horizontal&&(this._removedItem&&i===this._removedItem.index&&e.push({type:"undo",key:"undo-remove"}),e.push({type:"item",item:t,itemIndex:n,key:t._id}),i++)});return this._removedItem&&i===this._removedItem.index&&e.push({type:"undo",key:"undo-remove"}),e}_itemMoved(t){t.stopPropagation(),this._clearUndo();const{oldIndex:e,newIndex:i}=t.detail,o=[...this._config.items??[]],n=this._buildRows(o);if(!n[e]||"item"!==n[e].type)return;n.splice(i,0,n.splice(e,1)[0]);let r=_GROUP_DEFS[0];const s=[];for(const t of n)"divider"!==t.type?s.push({...t.item,vertical:r.vertical,horizontal:r.horizontal}):r=t.group;this._config={...this._config,items:s},this._fireConfig()}_verticalOptions=VERTICAL_OPTIONS;_horizontalOptions=HORIZONTAL_OPTIONS;_sortByOptions=SORT_BY_OPTIONS;_transitionOptions=TRANSITION_OPTIONS;_fitModeOptions=FIT_MODE_OPTIONS;_zoneModeOptions=ZONE_MODE_OPTIONS;_renderZoneModesPanel(){const t=this._config?.zone_modes??DEFAULT_ZONE_MODES;return html`
      <ha-expansion-panel header="Zone transition behavior" outlined .expanded=${!1}>
        <p class="zone-modes-hint">
          Static zones stay fixed on screen. Dynamic zones transition together
          with the photo. All overlay items placed in a zone share that zone's
          setting.
        </p>
        <div class="zone-modes-grid">
          ${_GROUP_DEFS.map(e=>{const i=`${e.vertical}-${e.horizontal}`;return html`
              <div class="zone-mode-cell">
                ${csSelectField(e.label,t[i]??"static",this._zoneModeOptions,t=>this._zoneModeChanged(i,t))}
              </div>
            `})}
        </div>
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
                `;const e=t.item,i=t.itemIndex,o="entity"in e,n=o?"Entity":"Template",r=o?"entity":"template",s=o?e.entity||`Entity ${i+1}`:e.template?e.template.length>30?e.template.slice(0,30)+"…":e.template:`Template ${i+1}`;serializeExtrasToYaml(e,UI_ITEM_KEYS);return html`
                <ha-expansion-panel
                  outlined
                  data-item-id="${e._id}"
                  .expanded=${this._expandedItemId===e._id}
                  @expanded-changed=${t=>{this._expandedItemId=t.detail.value?e._id:null}}
                >

                  <div slot="header" class="item-header-slot">
                    <div class="item-header-content${!1===e.show?" item-hidden":""}">
                      ${""}
                      <span class="item-type-badge ${r}">${n}</span>
                      <span>${s}</span>
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
                    ${csTextField("Font size (em)",e.font_size??"",t=>this._itemChanged(i,"font_size",t),{type:"number",step:"0.1",min:"0"})}
                    ${csTextField("Font weight",e.font_weight??"",t=>this._itemChanged(i,"font_weight",t),{type:"number",step:"100",min:"100",max:"900"})}
                    ${csTextField("Line height",e.line_height??"",t=>this._itemChanged(i,"line_height",t),{type:"number",step:"0.1",min:"0"})}
                    ${csTextField("Border\nradius (px)",e.border_radius??"",t=>this._itemChanged(i,"border_radius",t),{type:"number",step:"1",min:"0"})}
                  </div>

                  <!-- Background color and padding -->
                  <div class="item-bg-color-padding">
                    ${csColorPicker("Background color",e.background_color??"",t=>this._itemChanged(i,"background_color",t))}
                    ${csTextField("Padding\ntop (px)",e.padding_top??"",t=>this._itemChanged(i,"padding_top",t),{type:"number",step:"1",min:"0"})}
                    ${csTextField("Padding\nbottom (px)",e.padding_bottom??"",t=>this._itemChanged(i,"padding_bottom",t),{type:"number",step:"1",min:"0"})}
                    ${csTextField("Padding\nleft (px)",e.padding_left??"",t=>this._itemChanged(i,"padding_left",t),{type:"number",step:"1",min:"0"})}
                    ${csTextField("Padding\nright (px)",e.padding_right??"",t=>this._itemChanged(i,"padding_right",t),{type:"number",step:"1",min:"0"})}
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
      align-items: end;
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

    /* ── Zone modes grid ───────────────────────────────────────────────────── */

    .zone-modes-hint {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin: 4px 0 12px;
    }

    .zone-modes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .zone-mode-cell {
      min-width: 0;
    }

    /* ── Text fields ───────────────────────────────────────────────────────── */

    .text-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .text-field label {
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
          ${csTextField("Sensor entity (chrono_folder)",t.entity??"",t=>this._valueChanged("entity",t))}
        </div>

        <!-- Sort by + reverse -->
        <div class="card-row">
          ${csSelectField("Sort by",t.sort_by??"filename",this._sortByOptions,t=>this._valueChanged("sort_by",t))}
          ${csToggleField("Reverse order",t.sort_reverse??!1,t=>this._toggleChanged("sort_reverse",t))}
        </div>

        <!-- Display time + fit mode -->
        <div class="card-row">
          ${csTextField("Display time (seconds)",t.display_time??8,t=>this._numericValueChanged("display_time",t),{type:"number",step:"1",min:"1"})}
          ${csSelectField("Fit mode",t.fit_mode??"contain",this._fitModeOptions,t=>this._valueChanged("fit_mode",t))}
        </div>

        <!-- Transition + transition duration -->
        <div class="card-row">
          ${csSelectField("Transition",t.transition??"fade",this._transitionOptions,t=>this._valueChanged("transition",t))}
          ${csTextField("Transition duration (s)",t.transition_duration??.6,t=>this._numericValueChanged("transition_duration",t),{type:"number",step:"0.1",min:"0"})}
        </div>

      </ha-expansion-panel>

      <!-- ── Zone modes panel ────────────────────────────────────────────────── -->

      ${this._renderZoneModesPanel()}

      <!-- ── Items panel ─────────────────────────────────────────────────────── -->

      ${this._renderItemsPanel()}

    `}}function _parseExifDateTime(t){if(!t)return NaN;const e=String(t).match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);if(!e)return NaN;const[,i,o,n,r,s,a]=e;return new Date(`${i}-${o}-${n}T${r}:${s}:${a}`).getTime()}function _parseFileDateTime(t){return t.fileDate?new Date(`${t.fileDate}T${t.fileTime??"00:00:00"}`).getTime():NaN}function _bestDateTime(t){const e=_parseExifDateTime(t.exifDateTimeOriginal??t.exifDateTime);return isNaN(e)?_parseFileDateTime(t):e}function sortFiles(t,e,i){let o;if("random"===e){o=[...t];for(let t=o.length-1;t>0;t--){const e=Math.floor(Math.random()*(t+1));[o[t],o[e]]=[o[e],o[t]]}return o}return o="exifdatetime"===e?[...t].sort((t,e)=>_bestDateTime(t)-_bestDateTime(e)):"filedatetime"===e?[...t].sort((t,e)=>_parseFileDateTime(t)-_parseFileDateTime(e)):[...t].sort((t,e)=>(t.fileName??"").localeCompare(e.fileName??"")),i?o.reverse():o}customElements.define("chrono-slideshow-card-editor",ChronoSlideshowCardEditor);const TRANSITION_EXIT_TRANSFORM={"slide-left":"translateX(-100%)","slide-right":"translateX(100%)","slide-up":"translateY(-100%)","slide-down":"translateY(100%)"},TRANSITION_ENTER_FROM_TRANSFORM={"slide-left":"translateX(100%)","slide-right":"translateX(-100%)","slide-up":"translateY(100%)","slide-down":"translateY(-100%)"};class ChronoSlideshowCard extends LitElement{static properties={_config:{attribute:!1},_files:{state:!0},_currentIndex:{state:!0},_itemValues:{state:!0},_loadError:{state:!0},_swipeOffset:{state:!0},_transitioning:{state:!0},_scaleFactor:{state:!0}};static getCardSize(){return 5}static getConfigElement(){return document.createElement("chrono-slideshow-card-editor")}static getStubConfig(){return{...DEFAULT_CONFIG,items:[{template:"{{ fileName }}",vertical:"bottom",horizontal:"center",font_color:"white",font_size:1.1,font_weight:600}]}}constructor(){super(),this._config=null,this._hass=null,this._files=[],this._currentIndex=0,this._itemValues={},this._loadError=null,this._swipeOffset=0,this._transitioning=!1,this._itemSubs=new Map,this._subscribed=!1,this._timer=null,this._touchStartX=null,this._touchStartY=null,this._preloadedImages=new Map,this._outgoingPhoto=null,this._transitionDirection=1,this._transitionTimeoutId=null,this._animationStartedFor=null,this._transitionId=0,this._scaleFactor=1,this._resizeObserver=null}set hass(t){const e=this._hass;this._hass=t,this._config&&!this._subscribed&&this._loadFiles(),this._hassShouldRender(e,t)&&this.requestUpdate()}get hass(){return this._hass}_hassShouldRender(t,e){if(!t||!e)return!0;const i=this._config;if(!i)return!0;if(t.locale!==e.locale||t.formatEntityState!==e.formatEntityState)return!0;const o=new Set;i.entity&&o.add(i.entity);for(const t of i.items??[])t.entity&&o.add(t.entity);for(const i of o)if(t.states?.[i]!==e.states?.[i])return!0;return!1}setConfig(t){({config:t}=migrateConfig(t));const e=this._config;this._config=t;const i=!e||e.entity!==t.entity||e.sort_by!==t.sort_by||e.sort_reverse!==t.sort_reverse;this._hass&&(i?this._loadFiles():this._setupSubscriptions())}connectedCallback(){super.connectedCallback(),this._hass&&this._config&&!this._subscribed&&this._loadFiles(),this._startTimer(),this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect?.height;if(!e)return;const i=e/400;Math.abs(i-this._scaleFactor)>.01&&(this._scaleFactor=i)}),this._resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),this._teardownSubscriptions(),this._stopTimer(),this._resizeObserver?.disconnect()}_loadFiles(){const t=this._config?.entity,e=t?this._hass?.states?.[t]:null,i=e?.attributes?.files??[];this._files=sortFiles(i,this._config?.sort_by??"filename",this._config?.sort_reverse??!1),this._currentIndex=0,this._loadError=null,this._preloadedImages.clear(),this._setupSubscriptions(),this._preloadNeighbors(),this._restartTimer()}_photoAt(t){const e=this._files.length;if(0===e)return null;const i=((this._currentIndex+t)%e+e)%e;return this._files[i]}get _currentPhoto(){return this._photoAt(0)}get _nextPhoto(){return this._photoAt(1)}get _prevPhoto(){return this._photoAt(-1)}_preloadNeighbors(){for(const t of[this._prevPhoto,this._currentPhoto,this._nextPhoto]){if(!t)continue;const e=t.fileURL;if(!e||this._preloadedImages.has(e))continue;const i=new Image;i.src=e,this._preloadedImages.set(e,i)}const t=new Set([this._prevPhoto?.fileURL,this._currentPhoto?.fileURL,this._nextPhoto?.fileURL].filter(Boolean));for(const e of[...this._preloadedImages.keys()])t.has(e)||this._preloadedImages.delete(e)}_startTimer(){if(this._timer)return;const t=Math.max(1,this._config?.display_time??8);this._timer=setInterval(()=>this._advance(1),1e3*t)}_stopTimer(){this._timer&&(clearInterval(this._timer),this._timer=null)}_restartTimer(){this._stopTimer(),this._startTimer()}_advance(t){if(0===this._files.length||this._transitioning)return;const e=this._files.length,i=this._currentPhoto;this._currentIndex=((this._currentIndex+t)%e+e)%e,this._loadError=null,this._setupSubscriptions(),this._preloadNeighbors(),this._restartTimer();if("none"===(this._config?.transition??"fade")||!i)return this._transitioning=!1,this._outgoingPhoto=null,void this.requestUpdate();this._transitioning=!0,this._outgoingPhoto=i,this._transitionDirection=t,this._transitionId=(this._transitionId??0)+1,this.requestUpdate();const o=1e3*Math.max(0,this._config?.transition_duration??.6);this._transitionTimeoutId&&clearTimeout(this._transitionTimeoutId),this._transitionTimeoutId=setTimeout(()=>{this._transitioning=!1,this._outgoingPhoto=null,this.requestUpdate()},o+50)}_onTouchStart(t){if(this._transitioning)return;const e=t.changedTouches[0];this._touchStartX=e.clientX,this._touchStartY=e.clientY}_onTouchEnd(t){if(null===this._touchStartX)return;const e=t.changedTouches[0],i=e.clientX-this._touchStartX,o=e.clientY-this._touchStartY;this._touchStartX=null,this._touchStartY=null;Math.abs(i)<40||Math.abs(i)<Math.abs(o)||(i<0?this._advance(1):this._advance(-1))}_setupSubscriptions(){this._itemSubs||(this._itemSubs=new Map);const t=this._currentPhoto,e=this._config?.items??[],i=new Set;e.forEach((e,o)=>{if(!("template"in e))return;const n=`item-${o}`;i.add(n);const{text:r,fullyLiteral:s}=substitutePhotoVariables(e.template??"",t),a=this._itemSubs.get(n);if(a&&a.substituted===r)return;if(a?.unsub&&this._unsubscribeOne(a.unsub),s)return this._itemValues={...this._itemValues,[n]:r},void this._itemSubs.set(n,{substituted:r,unsub:null});const l=this._hass.connection.subscribeMessage(t=>{this._itemValues={...this._itemValues,[n]:t.result}},{type:"render_template",template:r});this._itemSubs.set(n,{substituted:r,unsub:l})});for(const[t,e]of[...this._itemSubs.entries()])if(!i.has(t)){e.unsub&&this._unsubscribeOne(e.unsub),this._itemSubs.delete(t);const{[t]:i,...o}=this._itemValues;this._itemValues=o}this._subscribed=!0}_unsubscribeOne(t){Promise.resolve(t).then(t=>{"function"==typeof t&&t()}).catch(()=>{})}_teardownSubscriptions(){if(this._itemSubs){for(const t of this._itemSubs.values())t.unsub&&this._unsubscribeOne(t.unsub);this._itemSubs.clear()}this._subscribed=!1}_handleAction(t,e="tap"){this._hass&&handleAction(this,this._hass,t,e)}_itemStyleMap(t){const e=t=>""!==t&&null!=t?`${t}px`:void 0,i=t=>""!==t&&null!=t?`${t}`:void 0;return{color:t.font_color||void 0,"font-size":(o=t.font_size*this._scaleFactor,""!==o&&null!=o?`${o}em`:void 0),"font-weight":i(t.font_weight),"line-height":i(t.line_height),"border-radius":e(t.border_radius*this._scaleFactor),"background-color":t.background_color||void 0,"padding-top":e(t.padding_top*this._scaleFactor),"padding-bottom":e(t.padding_bottom*this._scaleFactor),"padding-left":e(t.padding_left*this._scaleFactor),"padding-right":e(t.padding_right*this._scaleFactor)};var o}_renderItem(t,e){if(!1===t.show)return html``;if("template"in t){const i=`item-${e}`,o=this._itemValues[i]??"",n=t.tap_action&&"none"!==t.tap_action.action;return html`
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
      `}return html``}_renderZoneItems(t,e,i){const o=(this._config?.items??[]).filter(i=>(i.horizontal??"center")===e&&(i.vertical??"middle")===t);return 0===o.length?html``:html`
      <div class="overlay-zone overlay-zone-${t}-${e}">
        ${o.map(t=>this._renderItem(t,i.get(t)))}
      </div>
    `}_renderZoneGrid(t,e){const i=this._config?.zone_modes??DEFAULT_ZONE_MODES,o=["top","middle","bottom"].map(o=>{const n=["left","center","right"].map(n=>(i[`${o}-${n}`]??"static")!==t?html`<div class="overlay-cell"></div>`:html`<div class="overlay-cell">${this._renderZoneItems(o,n,e)}</div>`);return html`<div class="overlay-row">${n}</div>`});return html`<div class="overlay-grid overlay-grid-${t}">${o}</div>`}_onImageError(t){this._loadError=t?.fileName??"unknown file",this.requestUpdate()}_renderSlideUnit(t,e,i,o){if(!t)return html``;const n={"object-fit":i};return html`
      <div class="slide-unit" data-role="${o??""}">
        <img
          class="slide-image"
          src="${t.fileURL}"
          style=${styleMap(n)}
          @error=${()=>this._onImageError(t)}
        >
        ${this._renderZoneGrid("dynamic",e)}
      </div>
    `}_runTransitionAnimations(){if(!this._transitioning)return;const t=this.shadowRoot?.querySelector(".slide-stack");if(!t)return;const e=t.querySelector('.slide-unit[data-role="exiting"]'),i=t.querySelector('.slide-unit[data-role="entering"]');if(!e||!i)return;if(this._animationStartedFor===this._transitionId)return;this._animationStartedFor=this._transitionId;const o=this._config?.transition??"fade",n=(this._transitionDirection,1e3*Math.max(0,this._config?.transition_duration??.6)),r="ease";if("fade"===o)e.animate([{opacity:1},{opacity:0}],{duration:n,easing:r,fill:"forwards"}),i.animate([{opacity:0},{opacity:1}],{duration:n,easing:r,fill:"forwards"});else if(o.startsWith("slide-")){const t=TRANSITION_EXIT_TRANSFORM[o]??"translateX(-100%)",s=TRANSITION_ENTER_FROM_TRANSFORM[o]??"translateX(100%)";e.animate([{transform:"translate(0,0)"},{transform:t}],{duration:n,easing:r,fill:"forwards"}),i.animate([{transform:s},{transform:"translate(0,0)"}],{duration:n,easing:r,fill:"forwards"})}else if("curtain"===o)e.animate([{clipPath:"inset(0 0 0 0)"},{clipPath:"inset(0 0 0 100%)"}],{duration:n,easing:r,fill:"forwards"}),i.animate([{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0 0 0)"}],{duration:n,easing:r,fill:"forwards"});else if("clock"===o){i.style.maskImage="conic-gradient(from 0deg, #000 0deg, transparent 0deg)",i.style.webkitMaskImage=i.style.maskImage;const t=60,e=Array.from({length:t+1},(e,i)=>{const o=360*i/t,n=`conic-gradient(from 0deg, #000 ${o}deg, transparent ${o}deg)`;return{maskImage:n,webkitMaskImage:n}});i.animate(e,{duration:n,easing:"linear",fill:"forwards"})}}updated(t){super.updated(t),this._transitioning&&this._runTransitionAnimations()}static styles=css`
    :host {
      display: block;
      height: 100%;
    }
    ha-card {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 200px;
      overflow: hidden;
      box-sizing: border-box;
    }
    .slideshow-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      touch-action: pan-y;
    }

    /* ── Static overlay layer: outside the transitioning subtree ────────────── */
    .overlay-grid-static {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
    }

    /* ── Slide stack: holds the (max 2) currently-animating slide units ─────── */
    .slide-stack {
      position: absolute;
      inset: 0;
      z-index: 1;
      overflow: hidden;
    }
    .slide-unit {
      position: absolute;
      inset: 0;
    }
    .slide-unit[data-role="exiting"]  { z-index: 1; }
    .slide-unit[data-role="entering"] { z-index: 2; }
    .slide-image {
      display: block;
      width: 100%;
      height: 100%;
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
      padding: calc(8px * var(--scale-factor, 1));
    }
    .overlay-zone-top-left,    .overlay-zone-middle-left,   .overlay-zone-bottom-left   { align-items: flex-start; text-align: left;   }
    .overlay-zone-top-center, .overlay-zone-middle-center, .overlay-zone-bottom-center { align-items: center;     text-align: center; }
    .overlay-zone-top-right,  .overlay-zone-middle-right,  .overlay-zone-bottom-right  { align-items: flex-end;   text-align: right;  }

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
  `;render(){if(!this._config||!this._hass)return html``;const t=this._config,e=t.fit_mode??"contain",i=new Map((t.items??[]).map((t,e)=>[t,e])),o=t.entity;if(!(o?this._hass?.states?.[o]:null))return html`
        <ha-card style="--scale-factor: ${this._scaleFactor}">
          <div class="slideshow-container">
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:folder-alert-outline"></ha-icon>
                <div>Sensor not found: ${o||"(not configured)"}</div>
              </div>
            </div>
          </div>
        </ha-card>
      `;if(0===this._files.length)return html`
        <ha-card style="--scale-factor: ${this._scaleFactor}">
          <div class="slideshow-container">
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:image-off-outline"></ha-icon>
                <div>No photos found</div>
              </div>
            </div>
          </div>
        </ha-card>
      `;const n=this._currentPhoto,r=this._transitioning?this._outgoingPhoto:null;return html`
      <ha-card style="--scale-factor: ${this._scaleFactor}">
        <div
          class="slideshow-container"
          @touchstart=${t=>this._onTouchStart(t)}
          @touchend=${t=>this._onTouchEnd(t)}
        >
          ${this._renderZoneGrid("static",i)}

          <div class="slide-stack">
            ${r?this._renderSlideUnit(r,i,e,"exiting"):""}
            ${this._renderSlideUnit(n,i,e,r?"entering":null)}
          </div>

          ${this._loadError?html`
            <div class="message-overlay">
              <div>
                <ha-icon class="message-icon" icon="mdi:image-broken-variant"></ha-icon>
                <div>Failed to load: ${this._loadError}</div>
              </div>
            </div>
          `:""}
        </div>
      </ha-card>
    `}}customElements.define("chrono-slideshow-card",ChronoSlideshowCard),window.customCards=window.customCards||[],window.customCards.push({type:"chrono-slideshow-card",name:"Chrono Slideshow Card",description:"Slideshow of images from a chrono_folder sensor, with configurable overlays, transitions, and swipe navigation.",preview:!0});