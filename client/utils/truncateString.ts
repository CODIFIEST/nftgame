/** Truncates text to a maximum character length. */
function truncateString(toShorten:string, maxLength:number):string{
    let shorterString = toShorten.slice(0, maxLength)
    return shorterString;
}
export default truncateString ;