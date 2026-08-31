# Shopping Cart API Endpoints

===USER===
Das Backend API für den Shopping Cart soll ausgewechselt werden.
Dazu will ich eine Dokumentation aller HTTP- Endpoints erstellen welche aktuell verwendet werden.
Stell mir alle API Endpoints zusammen, welche zur Zeit im Zusammenhang mit dem Shopping Cart und dem erfassen von Aufträgen verwendet werden.
Als guten Einstiegspunkt für die Analyse kannst du D:\sources\webshop-frontend\webshop-frontend\app\features\cart\cartApi.server.ts verwenden.
Suche auch nach weitern Endpoints mit dem prefix `SERVER_CONFIG.BACKEND_URL` welche im Zusammenhang mit dem erstellen und Anzeigen von Aufträgen verwendet werden.

===AGENT===
Ich sammle zuerst die relevanten Cart- und Order-API-Aufrufe aus dem Code, beginnend beim genannten Einstiegspunkt, und gleiche danach gegen weitere `SERVER_CONFIG.BACKEND_URL`-Verwendungen ab.

===TOOL===
$ Get-Content -Raw "D:\sources\webshop-frontend\webshop-frontend\app\features\cart\cartApi.server.ts"
const HUB_CART_API = '/hub/bgh/cart';

fetchCurrentCartProlix -> GET    `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/current?...`
fetchCartStatusProlix -> GET     `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/current/status?...`
refreshCartProlix -> POST        `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/current/refresh?...`
createNewCartProlix -> POST      `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}`
cancelCartProlix -> POST         `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/current/cancel`
sendCartProlix -> POST           `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/current/complete`
changeDeliveryDateOfCartProlix -> POST `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/current/changedeliverydate`
addPositionProlix -> POST        `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/positions/add`
removePositionProlix -> DELETE   `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/positions/${positionId}?externalArticle=${externalArticle}`
mutatePositionProlix -> PUT      `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/positions/${positionId}`
fetchDeliveryCalendar -> GET     `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/current/deliveryCalendar/${weekOffset}`
sendPositionCommands -> POST     `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/positions/commands`
copyExistingOrderToCart -> POST  `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/positions/copy-order`
copyTemplateArticleToCart -> POST `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/positions/copy-template-article`
copySalesOrderSetArticleToCart -> POST `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/positions/copy-salesorderset-article`
importCsvToCart -> POST          `${SERVER_CONFIG.BACKEND_URL}${HUB_CART_API}/positions/import-csv`

===TOOL===
$ rg "SERVER_CONFIG\.BACKEND_URL" "D:\sources\webshop-frontend\webshop-frontend\app"
D:\sources\webshop-frontend\webshop-frontend\app\features\orders\order.server.ts:
  `/hub/bgh/customerorders?...`
  `/hub/bgh/customerorders/details/${id}`
  `/hub/bgh/customerorders/exports/${id}/confirmation`
  `/hub/bgh/customerorders/exports/${id}/pdf`
  `/hub/bgh/customerorders/exports/${id}/pdf?type=${type}`
  `/hub/bgh/customerorders/exports/${id}/excel`
  `/hub/bgh/customerorders/exports/${orderId}/${supplierId}`

D:\sources\webshop-frontend\webshop-frontend\app\shell\routes\OciEntryRoute.tsx:
  `/hub/bgh/cart/ensureociorder`

D:\sources\webshop-frontend\webshop-frontend\app\features\catalog\article.server.ts:
  `/hub/bgh/articledetails/prices?...`
  `/hub/bgh/articledetails/specialdeliverydates?...`
  `/hub/bgh/articledetails/orderendtimes?...`
  `/hub/bgh/articledetails/recentOrderInfo/${mainArticleId}`

===AGENT===
Der erste Durchlauf zeigt den Kern unter `/hub/bgh/cart` plus separate Order-Anzeige/Export-Endpunkte unter `/hub/bgh/customerorders`. Ich schaue jetzt in die konkreten Servermodule und die aufrufenden Routes/State-Machine, damit die Liste nicht nur URLs, sondern Zweck, Methode und Parameter enthält.

===TOOL===
$ Get-Content -Raw "D:\sources\webshop-frontend\webshop-frontend\app\features\orders\order.server.ts"
fetchOrders -> GET `/hub/bgh/customerorders?${params.toString()}`
  Query: from, to, sortBy, sortByDesc, start, rows, optional orderNumber, creationSystems[], orderTypes[]

fetchOrder -> GET `/hub/bgh/customerorders/details/${id}`
downloadConfirmationPdf -> GET blob `/hub/bgh/customerorders/exports/${id}/confirmation`
downloadArticleExportPdf -> GET blob `/hub/bgh/customerorders/exports/${id}/pdf`
downloadExportPdfByType -> GET blob `/hub/bgh/customerorders/exports/${id}/pdf?type=${type}`
downloadExcel -> GET blob `/hub/bgh/customerorders/exports/${id}/excel`
downloadExternalArticles -> GET blob `/hub/bgh/customerorders/exports/${orderId}/${supplierId}`

===TOOL===
$ Get-Content -Raw "D:\sources\webshop-frontend\webshop-frontend\app\shell\routes\OciEntryRoute.tsx"
Im OCI Entry Flow wird nach Login und Laden der Login-Info folgender Backend-Aufruf ausgeführt:
POST `${SERVER_CONFIG.BACKEND_URL}/hub/bgh/cart/ensureociorder`
Body: `{ ociCallback: callbackUrl }`

===AGENT===
Ich habe die Cart-/Order-bezogenen Backend-Aufrufe geprüft. Basis ist jeweils `${SERVER_CONFIG.BACKEND_URL}`.

**Shopping Cart**
| Methode | Endpoint | Zweck |
|---|---|---|
| `GET` | `/hub/bgh/cart/current?frontendOrderId={id?}` | aktuellen Warenkorb laden |
| `GET` | `/hub/bgh/cart/current/status?frontendOrderId={id?}` | Cart-Status laden |
| `POST` | `/hub/bgh/cart/current/refresh?frontendOrderId={id?}` | Warenkorb neu berechnen/refresh |
| `POST` | `/hub/bgh/cart` | neuen Warenkorb erstellen, Body: `{ orderSystem: "WEBSHOP", deliveryDate }` |
| `POST` | `/hub/bgh/cart/current/cancel` | Warenkorb stornieren, Body: `{ cancelReasonId, orderId }` |
| `POST` | `/hub/bgh/cart/current/complete` | Warenkorb abschliessen/Bestellung senden, Body: `{ reference, remarks, orderId }` |
| `POST` | `/hub/bgh/cart/current/changedeliverydate` | Lieferdatum ändern, Body: `{ desiredDeliveryDate, orderId }` |
| `GET` | `/hub/bgh/cart/current/deliveryCalendar/{weekOffset}` | Lieferkalender laden |
| `POST` | `/hub/bgh/cart/positions/add` | Position hinzufügen, Body: `IAddCustomerOrderCommandParamsData[]` |
| `DELETE` | `/hub/bgh/cart/positions/{positionId}?externalArticle={boolean}` | Position entfernen |
| `PUT` | `/hub/bgh/cart/positions/{positionId}` | Position ändern, Body: `{ articleNumber, quantity, deliveryDate, externalArticle }` |
| `POST` | `/hub/bgh/cart/positions/commands` | Verfügbarkeits-/Alternativ-Commands senden |
| `POST` | `/hub/bgh/cart/positions/copy-order` | bestehenden Auftrag in Cart kopieren, Body: `{ currentOrderId, existingOrderId }` |
| `POST` | `/hub/bgh/cart/positions/copy-template-article` | Vorlage in Cart kopieren, Body: `{ currentOrderId, templateId, selectedMainArticleIds? }` |
| `POST` | `/hub/bgh/cart/positions/copy-salesorderset-article` | SalesOrderSet-Artikel in Cart kopieren |
| `POST` | `/hub/bgh/cart/positions/import-csv` | CSV in Cart importieren, aktuell vom Client mit `{ currentOrderId, csvFile }` |

**OCI**
| Methode | Endpoint | Zweck |
|---|---|---|
| `POST` | `/hub/bgh/cart/ensureociorder` | OCI-Warenkorb/Auftrag sicherstellen, Body: `{ ociCallback }` |

**Aufträge Anzeigen / Exportieren**
| Methode | Endpoint | Zweck |
|---|---|---|
| `GET` | `/hub/bgh/customerorders?...` | Auftragsliste suchen/filtern |
| `GET` | `/hub/bgh/customerorders/details/{id}` | Auftragsdetail laden |
| `GET` | `/hub/bgh/customerorders/exports/{id}/confirmation` | Auftragsbestätigung PDF |
| `GET` | `/hub/bgh/customerorders/exports/{id}/pdf` | Artikelliste PDF |
| `GET` | `/hub/bgh/customerorders/exports/{id}/pdf?type={type}` | PDF-Export nach Report-Typ |
| `GET` | `/hub/bgh/customerorders/exports/{id}/excel` | Excel-Export |
| `GET` | `/hub/bgh/customerorders/exports/{orderId}/{supplierId}` | Fremdartikel-/Lieferanten-PDF |

Query-Parameter für `/customerorders`: `from`, `to`, `sortBy`, `sortByDesc`, `start`, `rows`, optional `orderNumber`, mehrfach `creationSystems`, mehrfach `orderTypes`.

**Angrenzende Endpoints Für Auftragserfassung**
Diese sind keine Cart-Mutations, beeinflussen aber Preis-/Lieferdatum-/Bestellinformationen beim Erfassen:

| Methode | Endpoint | Zweck |
|---|---|---|
| `GET` | `/hub/bgh/articledetails/prices?{params}` | Preisinfos für Artikel |
| `GET` | `/hub/bgh/articledetails/specialdeliverydates?{params}` | Speziallieferdaten |
| `GET` | `/hub/bgh/articledetails/orderendtimes?{params}` | Bestellschlusszeiten |
| `GET` | `/hub/bgh/articledetails/recentOrderInfo/{mainArticleId}` | letzte Bestellinfo zum Artikel |

Wichtiges Detail: Der Browser ruft zuerst lokale Resource-Routes wie `/resources/cart/add` auf; diese routen serverseitig auf die oben gelisteten Backend-Endpoints weiter.

===USER===
Kannst du bei der ersten Gruppe von Endpoints, welche aus dem cartApi.server.ts aufgerufen werden noch genauere informationen liefern: 
- Eine kurze Zusammenfassung über den Zweck und das Szenario in welchem der Endpoint aufgerufen wird
- Input- und Output-Schema

===AGENT===
Ich vertiefe jetzt nur die Cart-Gruppe aus `cartApi.server.ts`: dafür lese ich die State-Machine-Actors und die DTO-Strukturen, damit Zweck, Aufruf-Szenario und Schemas sauber zusammenpassen.

===TOOL===
$ Get-Content -Raw "D:\sources\webshop-frontend\webshop-frontend\app\features\cart\state-machine\backend-access\actors.ts"
fetchCartStatusActor -> api().fetchCartStatus(frontendOrderId)
fetchOrderActor -> api().fetchCurrentOrder(frontendOrderId)
refreshOrderActor -> api().refreshCurrentOrder(frontendOrderId)
createOrderActor -> api().createNewOrder(input)
processPositionIntentActor:
  ADD -> addPosition(orderId, articleNumber, quantity, externalArticle)
  REMOVE -> removePosition(positionId, externalArticle)
  MUTATE -> mutatePosition(positionId, payload)
  COPY_EXISTING_ORDER_TO_CART -> copyExistingOrderToCart(orderId, existingOrderId)
  COPY_TEMPLATE_ARTICLE_TO_CART -> copyTemplateArticleToCart(orderId, templateId, selectedMainArticleIds)
  COPY_SALESORDERSET_TO_CART -> copySalesOrderSetArticleToCart(orderId, articles)
  IMPORT_CSV_TO_CART -> importCsvToCart(orderId, csvText)
sendOrderActor -> sendCurrentOrder({ reference, remarks, orderId })
cancelOrderActor -> cancelCurrentOrder({ cancelReasonId, orderId })
setDeliveryDateActor -> changeDeliveryDateOfCurrentOrder({ desiredDeliveryDate, orderId })

===TOOL===
$ rg "export interface I(CartResponseDtoData|CartStatusResponseDtoData|OrderCurrentDTOData|...)" "D:\sources\webshop-frontend\webshop-frontend\app\dtos\ProdegaApiWebshop-api-typings-generated.ts" -n -A 35
ICartResponseDtoData:
  order: IOrderCurrentDTOData
  prolixErrorIdentifier: string
  messages: string[]
  positionAvailabilityOptions: ICartPositionAvailabilityOptionsDtoData[]
  expirationReason: IExpirationReasonData
  ociCustomerOrderMessage: IOciCustomerOrderMessageDtoData
  prolixError: boolean

ICartStatusResponseDtoData:
  orderId: number
  exists: boolean
  expirationReason: IExpirationReasonData
  lastModified: string
  prolixErrorIdentifier: string
  prolixError: boolean

ICompleteCartDtoData:
  reference: string
  remarks: string
  orderId: number

IAddCustomerOrderCommandParamsData:
  orderId: number
  articleNumber: string
  quantity: number
  externalArticle: boolean
  articleIsEan: boolean

===AGENT===
Ja. Hier ist die Cart-Gruppe aus `cartApi.server.ts` mit Zweck, Szenario und Schemas. Die Basis ist überall `${SERVER_CONFIG.BACKEND_URL}`.

**Gemeinsame Schemas**
Viele Endpoints liefern `ICartResponseDtoData` oder `ICartResponseDtoData[]` zurück:

```typescript
type CartResponse = {
  order: OrderCurrent;
  prolixErrorIdentifier: string;
  messages: string[];
  positionAvailabilityOptions: {
    message: string;
    availabilityOptions: {
      description: string;
      command: CustomerOrderPositionCommand;
    }[];
  }[];
  expirationReason: "CART_EXPIRED" | "INVALID_DELIVERY_DATE" | "NO_CUSTOMER";
  ociCustomerOrderMessage: {
    method: string;
    callbackUrl: string;
    data: string;
    positionCount: number;
  };
  prolixError: boolean;
};

type OrderCurrent = {
  id: number;
  state: CustomerOrderState;
  total: number;
  amountNeededForMinimalOrder: number;
  totalDiscount: number;
  remarks: string;
  reference: string;
  desiredDeliveryDate: Date;
  normalPositions: GroupedOrderPosition[];
  profitPlusPositions: GroupedProfitPlusPosition[];
  externalGroupedPositions: ExternalGroupedOrderPosition[];
  creationSystem: CustomerOrderSystem;
  lastModified: string;
  successfulSent: boolean;
};
```

Die Positionsdaten enthalten unter anderem `id`, `articleBaseNo`/`articleNumber`, `orderQuantity`, `deliveryDate`, `price`, `total`, `state`, `blocked`, `exists`, `hideCart`, `isProfitPlus`, `isWeightControlled`.

**Endpoints**
| Methode | Endpoint | Zweck / Szenario | Input | Output |
|---|---|---|---|---|
| `GET` | `/current?frontendOrderId={id?}` | Lädt den aktuellen Warenkorb. Wird beim Initialisieren der Cart-State-Machine und beim Hintergrund-Reload verwendet. Mit `frontendOrderId` prüft das Backend, ob der Frontend-Warenkorb noch der aktuelle ist. | Query optional: `frontendOrderId: string \| number` | `CartResponse` |
| `GET` | `/current/status?frontendOrderId={id?}` | Leichter Status-Check vor Positionsänderungen. Die State-Machine prüft damit, ob ein Cart existiert, ob er abgelaufen ist und ob `lastModified` noch passt. | Query optional: `frontendOrderId` | `{ orderId: number; exists: boolean; expirationReason; lastModified: string; prolixErrorIdentifier: string; prolixError: boolean }` |
| `POST` | `/current/refresh?frontendOrderId={id?}` | Refresh eines abgelaufenen oder veralteten Warenkorbs. Danach werden ausstehende Positions-Intents erneut verarbeitet. | Query optional: `frontendOrderId`; Body: `{}` | `CartResponse` |
| `POST` | `/` | Erstellt einen neuen Warenkorb. Wird aufgerufen, wenn eine Position hinzugefügt werden soll, aber noch kein aktueller Cart existiert. | `{ orderSystem: "WEBSHOP"; deliveryDate: string }` | `CartResponse` |
| `POST` | `/current/cancel` | Storniert den aktuellen Warenkorb. Szenarien: Benutzer bricht ab, Cart ist abgelaufen, OCI-Konflikt. | `{ cancelReasonId: number; orderId: number }` wobei das Frontend in Recovery-Szenarien `orderId` auch leer/undefined senden kann | `void` laut Typisierung |
| `POST` | `/current/complete` | Schliesst den Warenkorb ab und erfasst/send et den Auftrag. Wird beim Klick auf Bestellung absenden genutzt. Bei OCI kann danach `ociCustomerOrderMessage` zurückkommen. | `{ reference: string; remarks: string; orderId: number }` | `CartResponse` |
| `POST` | `/current/changedeliverydate` | Ändert das Wunschlieferdatum des gesamten Carts. Wird nach Auswahl im Lieferkalender aufgerufen, auch zur Recovery bei `INVALID_DELIVERY_DATE`. | `{ desiredDeliveryDate: string \| Date; orderId: number }` | `CartResponse` |
| `POST` | `/positions/add` | Fügt eine oder mehrere Positionen hinzu. Wird für normale “In den Warenkorb”-Aktionen und automatische Add-Flows genutzt. | `Array<{ orderId: number; articleNumber: string; quantity: number; externalArticle: boolean; articleIsEan: boolean }>` | `CartResponse[]` |
| `DELETE` | `/positions/{positionId}?externalArticle={boolean}` | Entfernt eine Position aus dem Warenkorb. | Path: `positionId: number`; Query: `externalArticle: boolean` | `CartResponse[]` |
| `PUT` | `/positions/{positionId}` | Ändert Menge/Lieferdatum einer Position. Im Browser wird wegen WAF-Historie lokal ein `POST /resources/cart/mutatePosition/:id` verwendet, serverseitig geht es als `PUT` ans Backend. | Path: `positionId`; Body: `{ articleNumber: string; quantity: number; deliveryDate: string \| Date; externalArticle: boolean }` | `CartResponse[]` |
| `GET` | `/current/deliveryCalendar/{weekOffset}` | Lädt verfügbare Lieferdaten für den Kalender. Wird beim Öffnen/Blättern des Delivery-Date-Pickers verwendet. | Path: `weekOffset: number` | `{ groups: { weekNumber: number; days: DeliveryDate[] }[]; assortments: ...[]; fromDate: Date; toDate: Date; firstDeliveryDate: Date }` |
| `POST` | `/positions/commands` | Sendet vom Benutzer gewählte Availability-Optionen zurück. Szenario: Backend meldet Verfügbarkeitsalternativen, Benutzer wählt eine Option. | `CustomerOrderPositionCommand[]`: `{ class: string; guid: string; customerOrderId: number; articleNumber: string; quantity: number; deliveryDate: Date; supplierInstruction: string; ignoreAssortment: boolean; originGuid: string }[]` | `CartResponse[]` |
| `POST` | `/positions/copy-order` | Kopiert Positionen aus einem bestehenden Auftrag in den aktuellen Cart. Szenario “Erneut bestellen” aus Auftragsdetails. | `{ currentOrderId: number; existingOrderId: number }` | `CartResponse[]` |
| `POST` | `/positions/copy-template-article` | Kopiert Artikel aus einer Bestellvorlage in den aktuellen Cart. Optional nur ausgewählte Main-Article-IDs. | `{ currentOrderId: number; templateId: number; selectedMainArticleIds?: number[] }` | `CartResponse[]` |
| `POST` | `/positions/copy-salesorderset-article` | Fügt SalesOrderSet-Artikel gesammelt dem Cart hinzu. | `{ currentOrderId: number; articles: { articleNumber: string; quantity: number }[] }` | `CartResponse[]` |
| `POST` | `/positions/import-csv` | Importiert Cart-Positionen aus CSV-Text. Wird vom CSV-Import im Warenkorb verwendet. | Frontend-Typ: `{ currentOrderId: number; csvText: string }`; tatsächlich vom Client gesendet: `{ currentOrderId: number; csvFile: string }` | `CartResponse[]` |

DTO-Quelle: `ProdegaApiWebshop-api-typings-generated.ts`. Aufruf-Szenarien kommen aus `actors.ts` und `cartMachine.ts`.

===USER===
Kannst du diese Zusammenfassung auf der Confluence Page https://prodega.atlassian.net/wiki/spaces/ENTWICKLUN/pages/4931715080/Vorhaben+Webshop+Anbindung+neue+Auftragserfassung+ERP+Erneuerung hinterlegen

===AGENT===
Ich öffne die Confluence-Seite erst lesend, damit ich den bestehenden Inhalt erhalte und die Endpoint-Dokumentation sauber anhängen kann, ohne vorhandene Abschnitte zu überschreiben.

===TOOL===
$ atlassian.getConfluencePage pageId=4931715080
{
  "id": "4931715080",
  "title": "Vorhaben: Webshop Anbindung neue Auftragserfassung (ERP Erneuerung)",
  "version": { "number": 1 },
  "body": "<p></p>"
}

===AGENT===
Die Seite ist aktuell praktisch leer (`<p></p>`), also lege ich die Zusammenfassung als neuen strukturierten Abschnitt mit Tabellen und gemeinsamen Schemas an.

===TOOL===
$ atlassian.updateConfluencePage pageId=4931715080
{
  "id": "4931715080",
  "version": {
    "number": 2,
    "message": "Dokumentation der aktuell verwendeten Cart Backend Endpoints ergänzt"
  },
  "title": "Vorhaben: Webshop Anbindung neue Auftragserfassung (ERP Erneuerung)",
  "status": "current",
  "links": {
    "webui": "/spaces/ENTWICKLUN/pages/4931715080/Vorhaben+Webshop+Anbindung+neue+Auftragserfassung+ERP+Erneuerung",
    "base": "https://prodega.atlassian.net/wiki"
  }
}

===AGENT===
Erledigt. Ich habe die Cart-Endpoint-Dokumentation auf der Confluence-Seite hinterlegt und die Seite auf Version `2` aktualisiert.

Link: [Vorhaben: Webshop Anbindung neue Auftragserfassung (ERP Erneuerung)](https://prodega.atlassian.net/wiki/spaces/ENTWICKLUN/pages/4931715080/Vorhaben+Webshop+Anbindung+neue+Auftragserfassung+ERP+Erneuerung)
