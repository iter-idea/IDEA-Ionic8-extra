import IdeaX = require('idea-toolbox');

/**
 * The signature, composed by a signatory and various dataURI formats.
 */
export class Signature extends IdeaX.Resource {
  /**
   * The contact who signed.
   */
  public signatory: string;
  /**
   * The PNG representation of the signature.
   */
  public pngURL: string;
  /**
   * The JPEG representation of the signature.
   */
  public jpegURL: string;

  public load(x: any) {
    super.load(x);
    this.signatory = this.clean(x.signatory, String);
    this.pngURL = this.clean(x.pngURL, String);
    this.jpegURL = this.clean(x.jpegURL, String);
  }
}
