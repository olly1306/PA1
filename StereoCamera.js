function StereoCamera(eyeSeparation, convergence, aspectRatio, fieldOfView, nearClipping, farClippingDistance) {
    this.eyeSeparation = eyeSeparation;
    this.convergence = convergence;
    this.mAspectRatio = aspectRatio;
    this.fieldOfView = fieldOfView;
    this.nearClipping = nearClipping;
    this.farClippingDistance = farClippingDistance;

    this.calcLeftFrustum = function() {
        let top, bottom, left, right;
        top = this.nearClipping * Math.tan(this.fieldOfView / 2);
        bottom = -top;

        let a = this.mAspectRatio * Math.tan(this.fieldOfView / 2) * this.convergence;
        let b = a - this.eyeSeparation / 2;
        let c = a + this.eyeSeparation / 2;

        left = -b * this.nearClipping / this.convergence;
        right = c * this.nearClipping / this.convergence;

        return m4.frustum(left, right, bottom, top, this.nearClipping, this.farClippingDistance);
    }

    this.calcRightFrustum = function() {
        let top, bottom, left, right;
        top = this.nearClipping * Math.tan(this.fieldOfView / 2);
        bottom = -top;

        let a = this.mAspectRatio * Math.tan(this.fieldOfView / 2) * this.convergence;
        let b = a - this.eyeSeparation / 2;
        let c = a + this.eyeSeparation / 2;

        left = -c * this.nearClipping / this.convergence;
        right = b * this.nearClipping / this.convergence;

        return m4.frustum(left, right, bottom, top, this.nearClipping, this.farClippingDistance);
    }
}