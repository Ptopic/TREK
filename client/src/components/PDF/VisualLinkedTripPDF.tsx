import React from 'react'
import { Document, Image, Link, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import type { AssignmentsMap, Category, Day, DayNote, Place, Trip } from '../../types'
import { getGoogleMapsUrlForPlace } from '../Planner/placeGoogleMaps'

type Props = {
  trip: Trip
  days: Day[]
  assignments: AssignmentsMap
  categories: Category[]
  dayNotes: DayNote[]
  locale: string
  photoUrls: Record<number, string>
}

const styles = StyleSheet.create({
  page: { padding: 26, backgroundColor: '#f8fafc', fontFamily: 'Helvetica', color: '#172033' },
  cover: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  coverTitle: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 28, textAlign: 'center' },
  coverText: { color: '#cbd5e1', fontSize: 11, marginTop: 10, textAlign: 'center', lineHeight: 1.45 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 7, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10 },
  dayBadge: { color: '#fff', backgroundColor: '#334155', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 7, fontFamily: 'Helvetica-Bold', fontSize: 8, marginRight: 8 },
  dayTitle: { flex: 1, color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 15 },
  dayDate: { color: '#cbd5e1', fontSize: 9 },
  overview: { borderLeftWidth: 3, borderLeftColor: '#2563eb', backgroundColor: '#eff6ff', borderRadius: 5, padding: 8, marginBottom: 8 },
  overviewLabel: { color: '#2563eb', fontFamily: 'Helvetica-Bold', fontSize: 7, marginBottom: 2 },
  overviewText: { color: '#334155', fontSize: 9, lineHeight: 1.4 },
  place: { flexDirection: 'row', backgroundColor: '#fff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 8, marginBottom: 7, overflow: 'hidden' },
  stripe: { width: 5 },
  image: { width: 58, height: 58, margin: 8, borderRadius: 6, objectFit: 'cover' },
  imageFallback: { width: 58, height: 58, margin: 8, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: '#fff', fontSize: 19 },
  placeInfo: { flex: 1, paddingTop: 8, paddingRight: 10, paddingBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  number: { color: '#fff', backgroundColor: '#1e293b', borderRadius: 9, width: 18, height: 18, textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 8, paddingTop: 5, marginRight: 6 },
  name: { flex: 1, color: '#172033', fontFamily: 'Helvetica-Bold', fontSize: 11 },
  category: { color: '#fff', borderRadius: 8, fontFamily: 'Helvetica-Bold', fontSize: 7, paddingVertical: 3, paddingHorizontal: 6, marginLeft: 5 },
  address: { color: '#64748b', fontSize: 8.5, marginTop: 4, marginLeft: 24, lineHeight: 1.3 },
  description: { color: '#64748b', fontSize: 8, marginTop: 3, marginLeft: 24, lineHeight: 1.3 },
  mapLink: { color: '#2563eb', fontFamily: 'Helvetica-Bold', fontSize: 8, marginTop: 4, marginLeft: 24, textDecoration: 'underline' },
  note: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 7, marginBottom: 7, padding: 9 },
  noteBar: { alignSelf: 'stretch', width: 3, backgroundColor: '#94a3b8', borderRadius: 2, marginRight: 8 },
  noteContent: { flex: 1, minWidth: 0 },
  noteText: { color: '#475569', fontSize: 9, lineHeight: 1.4 },
  noteTime: { color: '#94a3b8', fontSize: 8, marginTop: 3 },
  empty: { color: '#94a3b8', fontSize: 10, textAlign: 'center', marginTop: 30 },
})

function dateForPdf(date: string | null | undefined, locale: string) {
  if (!date) return ''
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale || 'en', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function toAbsoluteImageUrl(url: string | null | undefined) {
  if (!url) return undefined
  if (url.startsWith('data:') || /^https?:\/\//i.test(url)) return url
  return typeof window === 'undefined' ? url : new URL(url, window.location.origin).toString()
}

function LinkedTripDocument({ trip, days, assignments, categories, dayNotes, locale, photoUrls }: Props) {
  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number)
  return <Document title={`${trip.title || 'Trip'} itinerary`} author="TREK">
    <Page size="A4" style={[styles.page, styles.cover]}>
      <Text style={styles.coverTitle}>{trip.title || 'Travel plan'}</Text>
      {trip.description ? <Text style={styles.coverText}>{trip.description}</Text> : null}
      <Text style={styles.coverText}>{sortedDays.length} planned days</Text>
    </Page>
    {sortedDays.map(day => {
      const items = [
        ...(assignments[String(day.id)] || []).map(assignment => ({ type: 'place' as const, order: assignment.order_index ?? 0, value: assignment.place })),
        ...dayNotes.filter(note => note.day_id === day.id).map(note => ({ type: 'note' as const, order: note.sort_order ?? 0, value: note })),
      ].sort((a, b) => a.order - b.order)
      let number = 0
      return <Page key={day.id} size="A4" style={styles.page}>
        <View style={styles.dayHeader} fixed>
          <Text style={styles.dayBadge}>DAY {day.day_number}</Text>
          <Text style={styles.dayTitle}>{day.title || `Day ${day.day_number}`}</Text>
          {day.date ? <Text style={styles.dayDate}>{dateForPdf(day.date, locale)}</Text> : null}
        </View>
        {day.notes?.trim() ? <View style={styles.overview}><Text style={styles.overviewLabel}>DAY NOTE</Text><Text style={styles.overviewText}>{day.notes}</Text></View> : null}
        {items.length === 0 ? <Text style={styles.empty}>No places planned for this day.</Text> : items.map((item, index) => {
          if (item.type === 'note') {
            const note = item.value
            return <View key={`note-${note.id}-${index}`} style={styles.note} wrap={false}><View style={styles.noteBar} /><View style={styles.noteContent}><Text style={styles.noteText}>{note.text}</Text>{note.time?.trim() ? <Text style={styles.noteTime}>{note.time}</Text> : null}</View></View>
          }
          const place = item.value as Place | undefined
          if (!place) return null
          number += 1
          const category = categories.find(c => c.id === place.category_id)
          const color = category?.color || '#64748b'
          const mapsUrl = getGoogleMapsUrlForPlace(place)
          const imageUrl = toAbsoluteImageUrl(place.image_url || photoUrls[place.id])
          return <View key={`place-${place.id}-${index}`} style={styles.place} wrap={false}>
            <View style={[styles.stripe, { backgroundColor: color }]} />
            {imageUrl ? <Image src={imageUrl} style={styles.image} /> : <View style={[styles.imageFallback, { backgroundColor: color }]}><Text style={styles.fallbackText}>+</Text></View>}
            <View style={styles.placeInfo}>
              <View style={styles.nameRow}><Text style={styles.number}>{number}</Text><Text style={styles.name}>{place.name}</Text>{category ? <Text style={[styles.category, { backgroundColor: color }]}>{category.name}</Text> : null}</View>
              {place.address ? <Text style={styles.address}>{place.address}</Text> : null}
              {place.description ? <Text style={styles.description}>{place.description}</Text> : null}
              {mapsUrl ? <Link src={mapsUrl} style={styles.mapLink}>Open in Google Maps</Link> : null}
            </View>
          </View>
        })}
      </Page>
    })}
  </Document>
}

export async function downloadVisualLinkedTripPDF(props: Props) {
  const blob = await pdf(<LinkedTripDocument {...props} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(props.trip.title || 'trip').replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'trip'}-itinerary.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
