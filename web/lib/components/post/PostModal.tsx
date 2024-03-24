import { PostComplete } from 'lib/types/post'
import { Modal, ModalSize } from '../modal/Modal'
import { PostAddressAndDateTime } from './PostAddressAndDateTime'
import Map from '../map/Map'
import { OpenNavigationButton } from '../forms/OpenNavigationButton'
import { useMemo } from 'react'
import { Label } from '../forms/Label'
import Image from 'next/image'
import { postTagMappingWithIcon } from 'lib/data/enumMapping/postTagMapping'
import { IconAndLabel } from '../forms/IconAndLabel'
import { Participate } from './Participate'

interface PostModalProps {
  item: PostComplete
  onClose: () => void
}

export const PostModal = ({ item, onClose }: PostModalProps) => {
  const getCoordinates = (
    coordinates: number[] | null
  ): [number, number] | null => {
    if (coordinates && coordinates[0] && coordinates[1]) {
      return [coordinates[0], coordinates[1]]
    }
    return null
  }

  const coords = useMemo(() => {
    return getCoordinates(item.coordinates)
  }, [item.coordinates])

  const shouldShowMargin: boolean = useMemo(() => {
    return (
      item.availability.length > 0 ||
      (item.timeFrom !== null && item.timeTo !== null) ||
      (item.address !== null && item.address.length > 0)
    )
  }, [item.address, item.availability.length, item.timeFrom, item.timeTo])

  return (
    <>
      <Modal title={item.name} size={ModalSize.LARGE} onClose={onClose}>
        <PostAddressAndDateTime item={item} />
        {coords && item.address && (
          <div
            className={`row align-items-end ${shouldShowMargin ? 'mt-4' : ''}`}
          >
            <div className="col">
              <Map
                center={coords}
                zoom={11}
                markerPosition={coords}
                address={item.address}
              />
            </div>

            <div className="d-inline-flex justify-content-end mt-2">
              <OpenNavigationButton coordinates={coords} />
            </div>
          </div>
        )}
        <Label id={'description'} label="Popis" margin={shouldShowMargin} />
        <p>{item.shortDescription}</p>
        {item.longDescription.length > 0 && <p>{item.longDescription}</p>}
        {item.photoPath && (
          <div className="d-inline-block shadow bg-white rounded border p-3 pt-2 mb-2">
            <div
              className="smj-photo-size cursor-pointer"
              style={{
                position: 'relative',
              }}
            >
              <Image
                className="responsive"
                style={{ objectFit: 'contain' }}
                alt="Fotografie"
                src={`/api/posts/${item.id}/photo`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="eager"
                priority
                onMouseDown={e => {
                  // open image in new tab with middle mouse click
                  if (e.button === 0 || e.button === 1) {
                    window.open(`/api/posts/${item.id}/photo`)
                  }
                }}
              />
            </div>
          </div>
        )}
        <div className="d-flex flex-wrap justify-content-start allign-items-center fs-7 text-muted gap-2">
          {item.tags.map(tag => (
            <span key={tag} className="pill-static">
              <IconAndLabel
                icon={postTagMappingWithIcon[tag].icon ?? ''}
                label={postTagMappingWithIcon[tag].name}
              />
            </span>
          ))}
        </div>
        <hr />
        <div className="d-flex justify-content-end mt-auto">
          <Participate id={item.id} />
        </div>
      </Modal>
    </>
  )
}
