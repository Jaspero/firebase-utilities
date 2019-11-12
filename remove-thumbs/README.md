# Remove Thumbs

Remove thumbs for each image in the storage bucket.
Any files with `generated: 'true'` in metadata are considered thumbs
 
## Environment Variables

|Name|Required|Description|
|---|---|---|
|PI|true|Firebase project ID|
|SV|false|File name of the service account to use. Will use PI if undefined.|
|BN|false|storage bucket name. Will use PI if undefined.|
