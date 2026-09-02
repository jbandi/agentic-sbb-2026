# Auftrags-Kanal im Datenmodell finden

===USER===
/ppdb Ein ProlixPro Auftrag ist einem Kanal zugeordnet (z.B. "Integrale"). Kannst du mir sagen welches Feld in der DB diesen Kanal speichert? Und welche Werte es in der DB für da Feld gibt?

===AGENT===
Ich schaue nach, wie der "Kanal" (Channel) an einem ProlixPro-Auftrag gemappt ist. Dazu leite ich Tabellen- und Spaltennamen aus den Hibernate-Mappings des `ProdegaJpa`-Moduls ab, statt sie zu raten.

===PROGRESS===
Ich liste zuerst die Mapping-Dateien der Domäne `customerorder` auf und suche parallel in allen `.hbm.xml`-Dateien nach Begriffen wie Channel, Kanal und Integrale.

===TOOL===
$ ls server/ProdegaJpa/src/main/resources/customerorder/
CposCancelReason.hbm.xml
CposCancelReasonText.hbm.xml
CustomerOrder.hbm.xml
CustomerOrderAttachment.hbm.xml
CustomerOrderCustomerExchangeReceipt.hbm.xml
CustomerOrderLog.hbm.xml
CustomerOrderMDiscount.hbm.xml
CustomerOrderPosition.hbm.xml
CustomerOrderPositionMDiscount.hbm.xml
CustomerOrderPositionSscc.hbm.xml
ExternalArticlePosition.hbm.xml
InvalidCustomerOrderPosition.hbm.xml

===TOOL===
$ grep -ri "CHANNEL|Kanal|Integrale" server/ProdegaJpa/src/main/resources
hibernate.cfg.xml:261:        <mapping resource="dataexchange/DataExchangeChannel.hbm.xml"/>
dataexchange/DataExchangeChannel.hbm.xml:9: <class name="DataExchangeChannel" schema="PPADMIN" table="T_DATAEXCHANGE_CHANNEL"
dataexchange/DataExchangeChannel.hbm.xml:23: <map name="texts" schema="PPADMIN" table="T_DATAEXCHANGE_CHANNEL_TEXT" cascade="persist" lazy="false">
customerorder/CustomerOrder.hbm.xml:46:        <many-to-one name="dataExchangeChannel" column="CORD_DATAEXCHANGECHANNELID"
customerorder/CustomerOrder.hbm.xml:47:                     cascade="none" not-null="true" class="com.prodega.model.dataexchange.DataExchangeChannel"/>
customer/CustomerAdvertType.hbm.xml:17:        <property name="channel" column="CAT_CHANNEL">
customer/MessageChannelText.hbm.xml:17:        <property name="channel" column="MCT_CHANNEL">
sale/Detail.hbm.xml:69:            <column name="DETAIL_CHANNEL" precision="1" scale="0" />
… Ausgabe gekürzt …

===PROGRESS===
Der Treffer im Auftrag ist eindeutig: `CustomerOrder` hat eine `many-to-one`-Beziehung `dataExchangeChannel` auf die Spalte `CORD_DATAEXCHANGECHANNELID`. Ich lese jetzt das Mapping der Zieltabelle und den umliegenden Ausschnitt des Auftrags-Mappings, um Primärschlüssel und Textzuordnung zu klären.

===TOOL===
$ cat server/ProdegaJpa/src/main/resources/dataexchange/DataExchangeChannel.hbm.xml
<class name="DataExchangeChannel" schema="PPADMIN" table="T_DATAEXCHANGE_CHANNEL"
    dynamic-update="false" dynamic-insert="false" lazy="false">
    <id name="id" type="java.lang.Integer" column="DEC_ID" unsaved-value="null">
        <generator class="sequence">
            <param name="sequence">PPADMIN.S_DATAEXCHANGE_CHANNEL</param>
        </generator>
    </id>
    <version name="version" column="DEC_VERSION" />
    <property name="identifier" column="DEC_IDENTIFIER" type="string" />
    <map name="texts" schema="PPADMIN" table="T_DATAEXCHANGE_CHANNEL_TEXT" cascade="persist" lazy="false">
        <key column="DECTEXT_ID" />
        <map-key column="DECTEXT_LANGUAGEID" type="integer" />
        <element column="DECTEXT_TEXT" type="string" />
    </map>
</class>

===TOOL===
$ sed -n '40,55p' server/ProdegaJpa/src/main/resources/customerorder/CustomerOrder.hbm.xml
        <property name="creationSystem" column="CORD_CREATIONSYSTEM">
            <type name="org.hibernate.type.EnumType">
                <param name="enumClass">com.prodega.model.customerorder.CustomerOrderSystem</param>
                <param name="type">12</param>
            </type>
        </property>
        <many-to-one name="dataExchangeChannel" column="CORD_DATAEXCHANGECHANNELID"
                     cascade="none" not-null="true" class="com.prodega.model.dataexchange.DataExchangeChannel"/>
        <property name="userId" column="CORD_USERID" type="java.lang.Integer" />
        <property name="creationDate" column="CORD_CREATIONDATE" type="org.hibernate.type.LocalDateTimeType" />
        <property name="reference" column="CORD_REFERENCE" type="java.lang.String" />

===PROGRESS===
Zusätzlich suche ich im gesamten Repository nach "Integrale", um zu sehen, ob der Kanal auch im Java-Code als Konstante hinterlegt ist.

===TOOL===
$ grep -ri "Integrale" D:/sources/prolixpro
server/ProdegaJpa/src/main/java/com/prodega/model/dataexchange/DataExchangeChannel.java:13:    public static final Integer CHANNEL_INTEGRALE_IDENTIFIER = 1;
server/ProdegaEjb/src/main/java/com/prodega/service/pricing/assessor/OrderHasInternetDiscount.java:19: && DataExchangeChannel.CHANNEL_INTEGRALE_IDENTIFIER.equals(input.getRequest().getDataExchangeChannel().getId()));
server/ProdegaEjb/src/main/java/com/prodega/dao/hub/feature/orders/CustomerOrderSearchDao.java:98: * Lädt die Datenaustausch-Kanal-Identifier (z.B. INTEGRALE, MIGROS) für die angegebenen Auftrags-Ids.
server/ProdegaEjb/src/it/java/com/prodega/service/pricing/assessor/OrderHasInternetDiscountIT.java:90: request.setDataExchangeChannel(new DataExchangeChannel(DataExchangeChannel.CHANNEL_INTEGRALE_IDENTIFIER));
… Ausgabe gekürzt …

===TOOL===
$ cat server/ProdegaJpa/src/main/java/com/prodega/model/dataexchange/DataExchangeChannel.java
public class DataExchangeChannel extends TextMapEntity {
    public static final Integer CHANNEL_NONE_IDENTIFIER = 0;
    public static final Integer CHANNEL_INTEGRALE_IDENTIFIER = 1;
    public static final Integer CHANNEL_GASTRONOVI_IDENTIFIER = 2;
    public static final Integer CHANNEL_HOREGO_IDENTIFIER = 3;
    public static final Integer CHANNEL_MIGROS_IDENTIFIER = 4;
    private String identifier;
    public boolean isNone() {
        return id.equals(CHANNEL_NONE_IDENTIFIER);
    }
}

===PROGRESS===
Das Feld und die Zieltabelle sind geklärt. Ich frage jetzt die tatsächlich vorhandenen Kanal-Werte inklusive Übersetzungen über die Verbindung `pptest_mcp` ab — lesend, mit einem Join auf die Texttabelle.

===TOOL===
$ SELECT dec.DEC_ID, dec.DEC_IDENTIFIER, txt.DECTEXT_LANGUAGEID, txt.DECTEXT_TEXT FROM PPADMIN.T_DATAEXCHANGE_CHANNEL dec LEFT JOIN PPADMIN.T_DATAEXCHANGE_CHANNEL_TEXT txt ON txt.DECTEXT_ID = dec.DEC_ID ORDER BY dec.DEC_ID, txt.DECTEXT_LANGUAGEID
"DEC_ID","DEC_IDENTIFIER","DECTEXT_LANGUAGEID","DECTEXT_TEXT"
0,"NONE",0,"kein Kanal"
0,"NONE",1,"aucune chaîne"
0,"NONE",2,"nessun canale"
1,"INTEGRALE",0,"Integrale"
1,"INTEGRALE",1,"Integrale"
1,"INTEGRALE",2,"Integrale"
2,"GASTRONOVI",0,"Gastronovi"
3,"HOREGO",0,"Horego"
4,"MIGROS",0,"Migros"
5,"KLARYS",0,"Klarys"
21,"YOURBARMATE",0,"YourBarMate"

21 Zeilen ausgewählt.

===AGENT===
**Feld:** `PPADMIN.T_CUSTOMERORDER.CORD_DATAEXCHANGECHANNELID` — Fremdschlüssel (not-null) auf `PPADMIN.T_DATAEXCHANGE_CHANNEL.DEC_ID`.

Der Kanal steht also nicht als Text oder Enum am Auftrag, sondern als ID auf eine eigene Stammdatentabelle mit Übersetzungstabelle `T_DATAEXCHANGE_CHANNEL_TEXT` (LanguageId 0 = DE, 1 = FR, 2 = IT).

**Vorhandene Werte (Test-DB `pptest_mcp`):**

| DEC_ID | DEC_IDENTIFIER | Text (DE) |
|---|---|---|
| 0 | NONE | kein Kanal |
| 1 | INTEGRALE | Integrale |
| 2 | GASTRONOVI | Gastronovi |
| 3 | HOREGO | Horego |
| 4 | MIGROS | Migros |
| 5 | KLARYS | Klarys |
| 21 | YOURBARMATE | YourBarMate |

Die IDs 0–4 sind im Java-Code als Konstanten festgehalten (`DataExchangeChannel.java:12-16`); KLARYS und YOURBARMATE existieren nur in der DB. Ein Auftrag ohne Kanal hat `CORD_DATAEXCHANGECHANNELID = 0` (nicht NULL).

Beispiel — Aufträge des Kanals Integrale:

```sql
SELECT co.CORD_ID, co.CORD_CUSTOMERID, co.CORD_CUSTOMERCAT, co.CORD_CREATIONDATE
FROM PPADMIN.T_CUSTOMERORDER co
JOIN PPADMIN.T_DATAEXCHANGE_CHANNEL dec ON dec.DEC_ID = co.CORD_DATAEXCHANGECHANNELID
WHERE dec.DEC_IDENTIFIER = 'INTEGRALE';
```

Nicht verwechseln mit `CORD_CREATIONSYSTEM` (Enum `CustomerOrderSystem`) — das ist das erfassende System, nicht der Kanal.
