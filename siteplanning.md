I want this site to be basically just to start loading a random artwork using chicago API.

after basic thing working I want to basically have it so you can just set it and it loads a random art work in background
can provide text information from database
can change settings to specify the kind of art you want included.

**api**
https://api.artic.edu/docs/

/artworks/{id} detail endpoint
https://api.artic.edu/api/v1/artworks/129884

pagination with page/limit
https://api.artic.edu/api/v1/artworks?page=2&limit=100

searching for metadata containing the word "cats"
https://api.artic.edu/api/v1/artworks/search?q=cats

important fields:
artist_id
artist_title
date_start

**image API**
you have to then hit a separate API to get the image file using the image ID.
first retrieve the specific artwork and grab the "config" - > iiif_url
{
"data": {
"id": 27992,
"title": "A Sunday on La Grande Jatte — 1884",
"image_id": "2d484387-2509-5e8e-2c43-22f9981972eb"
},
"config": {
"iiif_url": "https://www.artic.edu/iiif/2",
}
}
then append the image_id to the URL:
https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb
then append this at the end (you have to)
https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb/full/843,/0/default.jpg

if you want larger image you could use this, but it is discouraged:
normal:
/full/843,/0/default.jpg
large:
/full/1686,/0/default.jpg




the art logic is a bit complicated and isnt working. i need to rewrite it now.

fetchArt
