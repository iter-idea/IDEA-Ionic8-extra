# IDEA Ionic extra ≫ Barcode

Scan barcodes and QR codes.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/barcode).

## To install

```
npm i --save @idea-ionic/barcode
```

_Be sure to install all the requested peer dependencies._

To use DataWedge on a supported Android device (e.g. Zebra), you have to add to the main Activity (`AndroidManifest.xml`) the following intent filter:

```xml
<intent-filter>
    <action android:name="com.easystep2.datawedge.plugin.intent.ACTION"/>
    <category android:name="android.intent.category.DEFAULT"/>
</intent-filter>
```

Finally, in case of DataWedge devices (e.g. Zebra), you need to [configure a scan profile](https://www.notion.so/iter-idea/236a88f61c4045fca017f3a035c3c89b).
