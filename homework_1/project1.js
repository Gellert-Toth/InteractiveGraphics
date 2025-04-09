// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
    for(let i = 0; i < fgImg.width; i++){
        for(let j = 0; j < fgImg.height; j++){
            let x = fgPos["x"] + i, y = fgPos["y"] + j;
            if(x < 0 || x >= bgImg.width || y < 0 || y >= bgImg.height) continue;

            let alphaf = fgOpac * fgImg.data[(j*fgImg.width+i)*4 + 3]/255.0, alphab = bgImg.data[(y*bgImg.width+x)*4 + 3]/255.0
            let alpha = (alphaf) + (1-alphaf) * alphab;
            bgImg.data[(y*bgImg.width+x)*4 + 3] = alpha * 255
            bgImg.data[(y*bgImg.width+x)*4] = (fgImg.data[(j*fgImg.width+i)*4] * alphaf + (1 - alphaf) * alphab * bgImg.data[(y*bgImg.width+x)*4])/alpha
            bgImg.data[(y*bgImg.width+x)*4 + 1] = (fgImg.data[(j*fgImg.width+i)*4+1] * alphaf + (1 - alphaf) * alphab * bgImg.data[(y*bgImg.width+x)*4+1])/alpha
            bgImg.data[(y*bgImg.width+x)*4 + 2] = (fgImg.data[(j*fgImg.width+i)*4+2] * alphaf + (1 - alphaf) * alphab * bgImg.data[(y*bgImg.width+x)*4+2])/alpha
        }
    }

}
