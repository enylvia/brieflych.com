/* eslint-disable @next/next/no-img-element */

type CompanyAvatarProps = {
  company: string;
  imageUrl?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export function CompanyAvatar({
  company,
  imageUrl,
  className,
  imageClassName,
  fallbackClassName,
}: CompanyAvatarProps) {
  const initial = company.charAt(0).toUpperCase();

  return (
    <div className={className}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${company} logo`}
          className={imageClassName}
        />
      ) : (
        <span className={fallbackClassName}>{initial}</span>
      )}
    </div>
  );
}
